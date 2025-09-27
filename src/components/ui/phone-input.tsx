
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  disabled?: boolean;
}

const countryCodes = [
  { code: '+60', country: 'Malaysia' },
  { code: '+1', country: 'United States' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+86', country: 'China' },
  { code: '+91', country: 'India' },
  { code: '+81', country: 'Japan' },
  { code: '+82', country: 'South Korea' },
  { code: '+65', country: 'Singapore' },
  { code: '+66', country: 'Thailand' },
  { code: '+84', country: 'Vietnam' },
  { code: '+62', country: 'Indonesia' },
  { code: '+63', country: 'Philippines' },
  { code: '+61', country: 'Australia' },
  { code: '+64', country: 'New Zealand' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+39', country: 'Italy' },
  { code: '+34', country: 'Spain' },
  { code: '+7', country: 'Russia' },
  { code: '+55', country: 'Brazil' },
  { code: '+52', country: 'Mexico' },
  { code: '+27', country: 'South Africa' },
  { code: '+971', country: 'UAE' },
  { code: '+966', country: 'Saudi Arabia' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  disabled = false
}) => {
  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={onCountryCodeChange} disabled={disabled}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Country code" />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.code} {country.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        placeholder="Phone number"
        value={phoneNumber}
        onChange={(e) => onPhoneNumberChange(e.target.value)}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
};
