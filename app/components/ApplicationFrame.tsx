"use client";
import {usePathname} from 'next/navigation';
import {isRecoveryPage} from '../../lib/auth/recovery';
import Header from './Header';
import Footer from './Footer';
import StorageMigration from './StorageMigration';
import DemoBanner from './DemoBanner';
export default function ApplicationFrame({children}:{children:React.ReactNode}){
 if(isRecoveryPage(usePathname()))return <>{children}</>;
 return <><Header/><div className="app-content flex min-w-0 flex-1 flex-col"><StorageMigration/><DemoBanner/>{children}<Footer/></div></>;
}
