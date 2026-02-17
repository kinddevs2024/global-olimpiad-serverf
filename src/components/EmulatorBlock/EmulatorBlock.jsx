import React from 'react';
import './EmulatorBlock.css';

/**
 * EmulatorBlock Component
 * 
 * Full-screen blocking overlay that prevents access to the application
 * when an emulator is detected. This component cannot be dismissed.
 */
const EmulatorBlock = () => {
  return (
    <div className="emulator-block-overlay">
      <div className="emulator-block-card">
        <div className="emulator-block-title">
          Похоже, сайт открыт через эмулятор.
        </div>
        <div className="emulator-block-message">
          Пожалуйста, откройте сайт на вашем реальном устройстве или на компьютере, используя ваш личный браузер.
        </div>
        <div className="emulator-block-message">
          Для продолжения работы закройте эмулятор и перезайдите на сайт.
        </div>
      </div>
    </div>
  );
};

export default EmulatorBlock;




