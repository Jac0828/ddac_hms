import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import './LuxurySelect.css';

interface Option {
  value: string | number;
  label: string;
}

interface LuxurySelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

const LuxurySelect: React.FC<LuxurySelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={`luxury-select-container ${className}`} ref={dropdownRef}>
      <div 
        className={`luxury-select-trigger ${isOpen ? 'is-open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="luxury-select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FaChevronDown className={`luxury-select-arrow ${isOpen ? 'rotated' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="luxury-select-dropdown">
          {options.map((option) => (
            <div
              key={option.value}
              className={`luxury-select-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LuxurySelect;





