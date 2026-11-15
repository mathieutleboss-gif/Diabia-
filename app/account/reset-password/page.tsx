import RecoveryForm from '../../components/RecoveryForm';
export const metadata={title:'Nouveau mot de passe',referrer:'no-referrer' as const,robots:{index:false,follow:false}};
export default function ResetPassword(){return <RecoveryForm recovery/>;}
