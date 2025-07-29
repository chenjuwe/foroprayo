import { db, auth } from '@/integrations/firebase/client';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { BaseService } from '../base/BaseService';
import { log } from '@/lib/logger';
import { ERROR_MESSAGES } from '@/constants';
import type { JourneyPost, CreateJourneyPostRequest } from '@/types/prayer';
import { getUnifiedUserName } from '@/lib/getUnifiedUserName';

/**
 * Service for managing Journey posts in Firebase.
 */
export class FirebaseJourneyService extends BaseService {
  private readonly COLLECTION_NAME = 'journey';

  constructor() {
    super('FirebaseJourneyService');
  }

  private convertDocToPost(doc: DocumentData): JourneyPost {
    const data = doc.data();
    const createdAt = data.created_at instanceof Timestamp
      ? data.created_at.toDate().toISOString()
      : data.created_at;
    const updatedAt = data.updated_at instanceof Timestamp
      ? data.updated_at.toDate().toISOString()
      : (data.updated_at || createdAt);

    return {
      id: doc.id,
      content: data.content,
      is_anonymous: data.is_anonymous,
      user_name: data.user_name,
      user_avatar: data.user_avatar,
      user_id: data.user_id,
      created_at: createdAt,
      updated_at: updatedAt,
      image_url: data.image_url || null,
      is_answered: data.is_answered || false,
      response_count: data.response_count || 0,
      like_count: data.like_count || 0,
    };
  }

  async getAllPosts(): Promise<JourneyPost[]> {
    this.logOperation('getAllPosts');
    try {
      const q = query(collection(db(), this.COLLECTION_NAME), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => this.convertDocToPost(doc));
      this.logOperation('getAllPosts success', { count: posts.length });
      return posts;
    } catch (error) {
      this.handleError(error, 'getAllPosts');
      throw error;
    }
  }

  async getPostById(id: string): Promise<JourneyPost | null> {
    this.logOperation('getPostById', { id });
    try {
      const docRef = doc(db(), this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.logOperation('getPostById success', { id });
        return this.convertDocToPost(docSnap);
      }
      return null;
    } catch (error) {
      this.handleError(error, 'getPostById');
      throw error;
    }
  }

  async createPost(post: CreateJourneyPostRequest): Promise<JourneyPost> {
    this.logOperation('createPost', post);
    try {
      const user = auth().currentUser;
      const postData = {
        ...post,
        user_id: user?.uid || post.user_id || null,
        user_name: post.user_name || (user ? getUnifiedUserName(user, post.is_anonymous) : '訪客'),
        user_avatar: post.user_avatar || (user && !post.is_anonymous ? user.photoURL : null),
        is_anonymous: user ? post.is_anonymous : true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        is_answered: false,
        response_count: 0,
        like_count: 0,
      };

      const docRef = await addDoc(collection(db(), this.COLLECTION_NAME), postData);
      const newDoc = await this.getPostById(docRef.id);
      if (!newDoc) {
        throw new Error('Failed to create post: New document not found.');
      }
      this.logOperation('createPost success', { id: docRef.id });
      return newDoc;
    } catch (error) {
      this.handleError(error, 'createPost');
      throw new Error(ERROR_MESSAGES.PRAYER_CREATE_ERROR);
    }
  }
  
  async deletePost(id: string): Promise<void> {
    this.logOperation('deletePost', { id });
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error(ERROR_MESSAGES.AUTH_ERROR);
      }

      const post = await this.getPostById(id);
      if (!post) {
        throw new Error('Post not found');
      }

      if (post.user_id !== user.uid) {
        throw new Error(ERROR_MESSAGES.PERMISSION_ERROR);
      }

      await deleteDoc(doc(db(), this.COLLECTION_NAME, id));
      this.logOperation('deletePost success', { id });
    } catch (error) {
      this.handleError(error, 'deletePost');
      throw error;
    }
  }
} 