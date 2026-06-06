import { Link } from 'react-router-dom';
import { Icons } from '@/components/Icons';
import { useShop } from '@/context/ShopContext';

type Option = {
  label: string;
  sub: string;
  to: string;
  icon: keyof typeof Icons;
};

const OPTIONS: Option[] = [
  { label: 'Working Hours', sub: 'Set your open & close times', to: '/working-hours', icon: 'Clock' },
  { label: 'Services', sub: 'Add or edit what you offer', to: '/services', icon: 'Grid' },
  { label: 'Staff', sub: 'Add & manage your team', to: '/staff', icon: 'Users' },
  { label: 'WhatsApp', sub: 'Chat connection settings', to: '/chats/setup', icon: 'WhatsApp' },
];

export default function Settings() {
  const { shop } = useShop();
  const options: Option[] = shop?.is_master
    ? [...OPTIONS, { label: 'All Businesses', sub: 'Master view — codes, PINs & activity', to: '/master', icon: 'Key' }]
    : OPTIONS;

  return (
    <div className="m-screen"><div className="m-scroll">
      <div className="c-page-head">
        <h1 className="c-page-title">Settings</h1>
        <p className="c-page-sub">Manage how your business runs on Rezzy.</p>
      </div>

      {options.map((o) => {
        const Icon = Icons[o.icon];
        return (
          <Link key={o.to} to={o.to} className="c-set-link">
            <span className="c-set-ic"><Icon size={18} /></span>
            <span className="c-set-body">
              <span className="c-set-label">{o.label}</span>
              <span className="c-set-sub">{o.sub}</span>
            </span>
            <Icons.Chevron size={18} />
          </Link>
        );
      })}
    </div></div>
  );
}
