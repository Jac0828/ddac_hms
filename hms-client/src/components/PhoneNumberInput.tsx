import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './PhoneNumberInput.css';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  showFlag?: boolean;
  style?: React.CSSProperties;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ value, onChange, className = '', required = false, showFlag = true, style }) => {
  return (
    <div className={`phone-input-wrapper ${className} ${!showFlag ? 'phone-input-no-flag-wrapper' : ''}`} style={style}>
      <PhoneInput
        international
        defaultCountry="US"
        value={value}
        onChange={onChange}
        className={`phone-input ${!showFlag ? 'phone-input-no-flag' : ''}`}
        required={required}
        withCountryCallingCode
        countryCallingCodeEditable={false}
        searchNames={true}
        searchPlaceholder="Search countries..."
        displayInitialValueAsLocalNumber={false}
      />
    </div>
  );
};

export default PhoneNumberInput;

