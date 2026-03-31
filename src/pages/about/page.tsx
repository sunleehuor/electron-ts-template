import { useTranslation } from 'react-i18next';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="text-red-800">About {t('hi')}</h1>
    </>
  );
}
