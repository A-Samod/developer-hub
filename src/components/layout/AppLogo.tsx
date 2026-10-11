export default function AppLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark-128.png"
      alt="Developer Hub"
      width={128}
      height={128}
      className={`rounded-lg object-cover ${className}`}
      decoding="async"
    />
  );
}
