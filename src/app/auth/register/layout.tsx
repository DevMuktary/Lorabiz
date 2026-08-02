import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register Account',
  description: 'Create your Lorabiz account to manage business and compliance services.',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
