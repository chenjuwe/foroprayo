import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';

// 直接導入主要頁面，不使用懶加載
import Index from "../pages/Index";
import Auth from "../pages/Auth";
import Prayers from "../pages/Prayers";
import New from "../pages/New";
import Log from "../pages/Log";
import Message from "../pages/Message";
import Profile from "../pages/Profile";
import TestFirebaseStorage from "../pages/TestFirebaseStorage";
import Setting from "../pages/Setting";
import Baptism from "../pages/Baptism";
import Miracle from "../pages/Miracle";
import Journey from "../pages/Journey";

// Claire 管理後台頁面
import ClaireLayout from "../pages/claire/ClaireLayout";
import ClaireDashboard from "../pages/claire/Dashboard";
import ClaireUsers from "../pages/claire/Users";
import ClairePrayers from "../pages/claire/Prayers";
import ClaireReports from "../pages/claire/Reports";
import ClaireSuperAdmins from "../pages/claire/SuperAdmins";

// 創建路由 - 不使用 withErrorBoundary，而是在路由中直接使用 ErrorBoundary
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <Index />
      </ErrorBoundary>
    ),
  },
  {
    path: "/prayers",
    element: (
      <ErrorBoundary>
        <Prayers />
      </ErrorBoundary>
    ),
  },
  {
    path: "/new",
    element: (
      <ErrorBoundary>
        <New />
      </ErrorBoundary>
    ),
  },
  {
    path: "/auth",
    element: (
      <ErrorBoundary>
        <Auth />
      </ErrorBoundary>
    ),
  },

  {
    path: "/profile",
    element: (
      <ErrorBoundary>
        <Profile />
      </ErrorBoundary>
    ),
  },
  {
    path: "/test-firebase-storage",
    element: (
      <ErrorBoundary>
        <TestFirebaseStorage />
      </ErrorBoundary>
    ),
  },
  {
    path: "/setting",
    element: (
      <ErrorBoundary>
        <Setting />
      </ErrorBoundary>
    ),
  },
  {
    path: "/log",
    element: (
      <ErrorBoundary>
        <Log />
      </ErrorBoundary>
    ),
  },
  {
    path: "/message",
    element: (
      <ErrorBoundary>
        <Message />
      </ErrorBoundary>
    ),
  },
  {
    path: "/baptism",
    element: (
      <ErrorBoundary>
        <Baptism />
      </ErrorBoundary>
    ),
  },
  {
    path: "/miracle",
    element: (
      <ErrorBoundary>
        <Miracle />
      </ErrorBoundary>
    ),
  },
  {
    path: "/journey",
    element: (
      <ErrorBoundary>
        <Journey />
      </ErrorBoundary>
    ),
  },

  // Claire 管理後台路由
  {
    path: "/claire",
    element: (
      <ErrorBoundary>
        <ClaireLayout />
      </ErrorBoundary>
    ),
    children: [
      { 
        index: true, 
        element: (
          <ErrorBoundary>
            <ClaireDashboard />
          </ErrorBoundary>
        ) 
      },
      { 
        path: "users", 
        element: (
          <ErrorBoundary>
            <ClaireUsers />
          </ErrorBoundary>
        ) 
      },
      { 
        path: "prayers", 
        element: (
          <ErrorBoundary>
            <ClairePrayers />
          </ErrorBoundary>
        ) 
      },
      { 
        path: "reports", 
        element: (
          <ErrorBoundary>
            <ClaireReports />
          </ErrorBoundary>
        ) 
      },
      { 
        path: "super-admins", 
        element: (
          <ErrorBoundary>
            <ClaireSuperAdmins />
          </ErrorBoundary>
        ) 
      },
    ],
  },
]); 