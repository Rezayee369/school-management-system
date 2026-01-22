import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
  
  // This component will not render anything as the redirect happens on the server.
  return null;
}
