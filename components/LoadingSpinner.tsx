interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
}

export default function LoadingSpinner({ size = 'medium' }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-fossr-purple border-t-transparent rounded-full animate-spin`}
      ></div>
    </div>
  )
}
