import { useEffect, useState } from 'react';
import styles from './Callback.module.css';

function Callback() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const extractedToken = extractTokenFromUrl(window.location.href);
    
    if (extractedToken) {
      setToken(extractedToken);
      
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'yandex_token',
          access_token: extractedToken
        }, '*');
        
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    } else {
      setError('Токен не найден в URL');
    }
  }, []);

  const extractTokenFromUrl = (url) => {
    const hashMatch = url.match(/#access_token=([^&]+)/);
    if (hashMatch) {
      return decodeURIComponent(hashMatch[1]);
    }
    
    const queryMatch = url.match(/[?&]access_token=([^&]+)/);
    if (queryMatch) {
      return decodeURIComponent(queryMatch[1]);
    }
    
    return null;
  };

  const copyToClipboard = async () => {
    if (token) {
      try {
        await navigator.clipboard.writeText(token);
        alert('Токен скопирован!');
      } catch (err) {
        alert('Не удалось скопировать токен');
      }
    }
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <p className={styles.url}>{window.location.href}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.spinner}></div>
        <h2>Обработка токена...</h2>
        <p>Пожалуйста, подождите</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Токен получен!</h2>
        <div className={styles.tokenDisplay}>
          <div className={styles.tokenLabel}>Access Token:</div>
          <div className={styles.tokenValue}>{token}</div>
        </div>
        <button onClick={copyToClipboard} className={styles.button}>
          Копировать токен
        </button>
      </div>
    </div>
  );
}

export default Callback;
