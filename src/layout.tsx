import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router';
import { T } from './data/locales/translate';
import { Toaster } from 'sonner';

export default function Layout() {
  const { t, i18n } = useTranslation();

  return (
    <>
      <Outlet />
      <div className="flex gap-3">
        <button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en')}>
          {i18n.language} {t(T.Export)}
        </button>
        <NavLink to={'/'} title="Home">
          Home
        </NavLink>
        <NavLink to={'/about'} title="About">
          About
        </NavLink>
        <NavLink to={'/maok'} title="Maok">
          Maok
        </NavLink>
      </div>
      <Toaster />
    </>
  );
}
