import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <h3 className="mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
