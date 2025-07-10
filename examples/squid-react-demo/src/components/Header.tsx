import Icon from '@/components/lib/Icon.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function Header() {
  const { user, logout } = useAuth0();
  if (!user || !user.name) {
    return <div></div>;
  }

  return (
    <div className={'h-[72px] w-full bg-[#0D2752] container flex items-center justify-between mb-[48px]'}>
      <Link to={'/'}>
        <Icon icon={'logo'} className={'w-[130px] h-[33px] text-[#FFF]'} />
      </Link>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar>
              <AvatarImage src={user.picture} />
              <AvatarFallback>{user.name}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
              <Icon icon={'sign_out_icon'} />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
