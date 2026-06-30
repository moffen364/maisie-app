export default function Spinner({ className = 'w-4 h-4 border-2 border-white border-t-transparent' }: { className?: string }) {
  return <span className={`${className} rounded-full animate-spin`} />;
}
