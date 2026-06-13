import { ExternalLink } from 'lucide-react'

export default function LinkButton({
  href,
  label = 'เปิด',
  icon: Icon = ExternalLink,
  onClick,
  variant = 'ghost',
  disabled = false,
  className = '',
}) {
  const classes = `${variant === 'primary' ? 'btn btn-primary' : 'btn btn-ghost'} ${className}`
  if (href) {
    return (
      <a className={classes} href={href} target="_blank" rel="noreferrer">
        <Icon size={17} />
        <span>{label}</span>
      </a>
    )
  }
  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled}>
      <Icon size={17} />
      <span>{label}</span>
    </button>
  )
}
