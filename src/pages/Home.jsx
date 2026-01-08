import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './Home.module.css';

function Home() {
  const [searchParams] = useSearchParams();
  const [backendUrl, setBackendUrl] = useState(null);
  const [oauthUrl, setOauthUrl] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const hgramid = searchParams.get('hgramid');

  const showStatus = useCallback((message, type) => {
    setStatus({ message, type });
  }, []);

  const sendToBackend = useCallback((inputValue) => {
    if (!backendUrl) {
      setStatus({ message: 'Конфигурация бэкенда не загружена', type: 'error' });
      return;
    }

    if (!inputValue || inputValue.trim() === '') {
      setStatus({ message: 'Введите URL', type: 'error' });
      return;
    }

    try {
      const url = new URL(backendUrl);
      url.searchParams.set('url', inputValue);
      
      if (hgramid) {
        url.searchParams.set('hgramid', hgramid);
      }
      
      window.location.href = url.toString();
    } catch (error) {
      setStatus({ message: 'Ошибка при переходе на бэкенд', type: 'error' });
    }
  }, [backendUrl, hgramid]);

  const loadBackendConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();
      setBackendUrl(config.backendUrl);
      setOauthUrl(config.oauthUrl);
    } catch (error) {
      showStatus('Не удалось загрузить конфигурацию бэкенда', 'error');
    }
  }, [showStatus]);

  useEffect(() => {
    loadBackendConfig();
  }, [loadBackendConfig]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'yandex_token' && event.data?.access_token) {
        if (urlInput.trim()) {
          sendToBackend(urlInput);
        } else {
          showStatus('Токен получен. Вставьте URL из окна авторизации и нажмите "Отправить"', 'success');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [urlInput, sendToBackend, showStatus]);

  const handleAuth = () => {
    if (!oauthUrl) {
      showStatus('OAuth URL не загружен', 'error');
      return;
    }

    setStatus({ message: '', type: '' });
    
    const popup = window.open(
      oauthUrl,
      'Yandex OAuth',
      `width=600,height=700,scrollbars=yes,resizable=yes,left=${window.screen.width / 2 - 300},top=${window.screen.height / 2 - 350}`
    );

    if (!popup) {
      showStatus('Не удалось открыть popup. Разрешите всплывающие окна для этого сайта.', 'error');
      return;
    }

    showStatus('Окно авторизации открыто. После авторизации скопируйте URL из адресной строки открывшегося окна.', 'info');
  };

  const handleSubmit = () => {
    sendToBackend(urlInput);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Получение Yandex OAuth Token</h1>
        
        <div className={styles.instructions}>
          <strong>Инструкция:</strong> Нажмите кнопку ниже, чтобы открыть окно авторизации Yandex. 
          После авторизации скопируйте URL из адресной строки открывшегося окна и вставьте его ниже.
        </div>

        {!hgramid && (
          <div className={`${styles.status} ${styles.error}`}>
            Внимание: параметр hgramid не передан в URL. Убедитесь, что вы открыли страницу с правильным параметром.
          </div>
        )}

        <div className={styles.inputSection}>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Вставьте URL сюда"
            className={styles.input}
          />
          <button onClick={handleSubmit} className={styles.button}>
            Отправить
          </button>
        </div>

        <button onClick={handleAuth} className={styles.button}>
          Авторизоваться через Yandex
        </button>

        {status.message && (
          <div className={`${styles.status} ${styles[status.type]}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
