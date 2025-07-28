import React from 'react';
import PrayforLogo from '../../assets/icons/PrayforLogo.svg';

export function AuthLogo() {
  return (
    <div className="mb-12">
      <img
        src={PrayforLogo}
        alt="Prayfor Logo"
        className="aspect-[3.27] object-contain w-[100px] md:w-[120px] lg:w-[140px]"
        style={{ color: '#000000' }}
      />
    </div>
  );
}
