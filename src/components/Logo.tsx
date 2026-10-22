import Image from 'next/image';

export function Logo({ size = 36 }: { size?: number }) {
  return <Image src="/logo.svg" alt="Maestranza Mena" width={size} height={size} priority />;
}
