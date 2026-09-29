// Travelbook-styled text input ("travelbook-slot" texture, see globals.css) — shared by the
// auth forms (left-aligned label/value) and the profile edit form (centered value), which
// differ only in that alignment and the input's horizontal padding.

interface TextFieldProps {
    label: string
    name: string
    type?: string
    autoComplete?: string
    placeholder?: string
    defaultValue?: string
    required?: boolean
    disabled?: boolean
    minLength?: number
    maxLength?: number
    pattern?: string
    patternTitle?: string
    align?: 'left' | 'center'
    readOnly?: boolean
}

export default function TextField({
    label,
    name,
    type = 'text',
    autoComplete,
    placeholder = '...',
    defaultValue,
    required,
    disabled,
    minLength,
    maxLength,
    pattern,
    patternTitle,
    align = 'left',
    readOnly,
}: TextFieldProps) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-left font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">
                {label}
            </span>
            <input
                name={name}
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                defaultValue={defaultValue}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
                minLength={minLength}
                maxLength={maxLength}
                pattern={pattern}
                title={patternTitle}
                className={`travelbook-slot w-full bg-transparent font-serif text-base text-ink-text
                    placeholder:text-ink-muted/60 outline-none
                    ${align === 'center' ? 'px-3 py-2 text-center' : 'py-2 pl-4 pr-3 text-left'}`}
            />
        </label>
    )
}
