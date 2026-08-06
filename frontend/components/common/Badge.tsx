interface BadgeProps {
  text: string;
}

export default function Badge({ text }: BadgeProps) {
  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
      {text}
    </span>
  );
}