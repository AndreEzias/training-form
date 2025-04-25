import React, { useState } from 'react';

interface ToggleSwitchProps {
    options: string[];
    defaultOption?: number;
    onChange?: (selectedOption: string, selectedIndex: number) => void;
    className?: string;
    value?: string;
}

const ToggleField: React.FC<ToggleSwitchProps> = ({
    options,
    defaultOption = 0,
    onChange,
    className,
    value
}) => {
    const [selectedIndex, setSelectedIndex] = useState(defaultOption);

    const handleToggle = () => {
        const nextIndex = (selectedIndex + 1) % options.length;
        setSelectedIndex(nextIndex);

        if (onChange) {
            onChange(options[nextIndex], nextIndex);
        }
    };

    return (
        <div className={className}>
            <div
                className="relative inline-block cursor-pointer"
                onClick={handleToggle}
            >
                <input type='hidden' value={value} />
                <div className="flex items-center justify-center bg-gray-200 border border-gray-300 rounded-md px-4 py-2 transition-all duration-300 hover:bg-gray-300">
                    <span className="text-gray-800 font-medium">{options[selectedIndex]}</span>
                </div>
            </div>
        </div>
    );
};

export default ToggleField;