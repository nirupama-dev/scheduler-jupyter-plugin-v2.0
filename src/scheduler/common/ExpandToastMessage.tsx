import React, { useState, useEffect } from 'react';
import { ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ExpandableToastProps extends ToastOptions {
  message: string;
}
const ExpandToastMessage: React.FC<ExpandableToastProps> = ({
  message,
  ...rest
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [truncatedMessage, setTruncatedMessage] = useState('');
  const [showExpandButton, setShowExpandButton] = useState(false);
  const truncateLength = 50; // Adjust as needed

  useEffect(() => {
    if (message.length > truncateLength) {
      setTruncatedMessage(message.substring(0, truncateLength) + '  ');
      setShowExpandButton(true);
    } else {
      setTruncatedMessage(message);
      setShowExpandButton(false);
    }
  }, [message, truncateLength]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div onClick={toggleExpand} className="cursor-icon">
      {isExpanded ? message : truncatedMessage}
      {showExpandButton && !isExpanded && (
        <span className="expand-btn"> ...</span>
      )}
      {showExpandButton && isExpanded && (
        <span className="expand-btn"> Less</span>
      )}
    </div>
  );
};

export default ExpandToastMessage;
