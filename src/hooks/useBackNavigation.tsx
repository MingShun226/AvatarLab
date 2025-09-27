
import { useNavigate } from 'react-router-dom';

export const useBackNavigation = () => {
  const navigate = useNavigate();

  const goBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to dashboard if no history
      navigate('/dashboard');
    }
  };

  return { goBack };
};
