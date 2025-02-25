import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '@/styles/DirectorySelector.module.css';

interface DirectorySelectorProps {
  onDirectorySelected: (directory: string) => void;
}

const DirectorySelector: React.FC<DirectorySelectorProps> = ({ onDirectorySelected }) => {
  const [directory, setDirectory] = useState<string>('/home');
  const [folderName, setFolderName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'open' | 'create'>('open');
  const [availableDirectories, setAvailableDirectories] = useState<string[]>([]);
  const [loadingDirectories, setLoadingDirectories] = useState<boolean>(false);

  // Fetch available directories when the current directory changes
  useEffect(() => {
    fetchDirectories(directory);
  }, [directory]);

  const fetchDirectories = async (parentDir: string) => {
    setLoadingDirectories(true);
    try {
      const response = await axios.get('/api/listDirectories', {
        params: { path: parentDir }
      });
      setAvailableDirectories(response.data.directories);
    } catch (error) {
      console.error('Error fetching directories:', error);
      setAvailableDirectories([]);
    } finally {
      setLoadingDirectories(false);
    }
  };

  const handleDirectoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirectory(e.target.value);
    setError(null);
  };

  const handleFolderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFolderName(e.target.value);
    setError(null);
  };

  const handleNavigateUp = () => {
    const parentDir = directory.split('/').slice(0, -1).join('/') || '/';
    setDirectory(parentDir);
  };

  const handleSelectDirectory = (dir: string) => {
    setDirectory(dir);
  };

  const handleOpenDirectory = async () => {
    if (!directory) {
      setError('Please enter a directory path');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/selectDirectory', {
        action: 'open',
        directory
      });

      if (response.data.success) {
        onDirectorySelected(directory);
      } else {
        setError(response.data.message || 'Failed to open directory');
      }
    } catch (error: any) {
      console.error('Error opening directory:', error);
      setError(error.response?.data?.message || 'Failed to open directory');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirectory = async () => {
    if (!directory) {
      setError('Please enter a parent directory path');
      return;
    }

    if (!folderName) {
      setError('Please enter a folder name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/selectDirectory', {
        action: 'create',
        directory,
        name: folderName
      });

      if (response.data.success) {
        onDirectorySelected(response.data.directory);
      } else {
        setError(response.data.message || 'Failed to create directory');
      }
    } catch (error: any) {
      console.error('Error creating directory:', error);
      setError(error.response?.data?.message || 'Failed to create directory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Claude Code IDE</h2>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'open' ? styles.active : ''}`}
            onClick={() => setActiveTab('open')}
          >
            Open Folder
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Folder
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'open' ? (
            <div className={styles.openFolder}>
              <div className={styles.pathNavigation}>
                <input
                  id="directory"
                  type="text"
                  value={directory}
                  onChange={handleDirectoryChange}
                  className={styles.input}
                  placeholder="Enter folder path (e.g., /home/user/projects)"
                />
                <button 
                  className={styles.navButton}
                  onClick={handleNavigateUp}
                  title="Navigate to parent directory"
                >
                  ⬆️
                </button>
              </div>
              
              <div className={styles.directoryList}>
                {loadingDirectories ? (
                  <div className={styles.loading}>Loading directories...</div>
                ) : availableDirectories.length > 0 ? (
                  <>
                    <div className={styles.directoryListHeader}>Available Directories:</div>
                    <div className={styles.directoryItems}>
                      {availableDirectories.map((dir) => (
                        <div 
                          key={dir} 
                          className={styles.directoryItem}
                          onClick={() => handleSelectDirectory(dir)}
                        >
                          📁 {dir.split('/').pop()}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.noDirectories}>No accessible directories found</div>
                )}
              </div>
              
              <div className={styles.actions}>
                <button 
                  className={styles.button}
                  onClick={handleOpenDirectory}
                  disabled={loading}
                >
                  {loading ? 'Opening...' : 'Open Folder'}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.createFolder}>
              <div className={styles.pathNavigation}>
                <input
                  id="parent-directory"
                  type="text"
                  value={directory}
                  onChange={handleDirectoryChange}
                  className={styles.input}
                  placeholder="Enter parent folder path (e.g., /home/user)"
                />
                <button 
                  className={styles.navButton}
                  onClick={handleNavigateUp}
                  title="Navigate to parent directory"
                >
                  ⬆️
                </button>
              </div>
              
              <div className={styles.directoryList}>
                {loadingDirectories ? (
                  <div className={styles.loading}>Loading directories...</div>
                ) : availableDirectories.length > 0 ? (
                  <>
                    <div className={styles.directoryListHeader}>Available Directories:</div>
                    <div className={styles.directoryItems}>
                      {availableDirectories.map((dir) => (
                        <div 
                          key={dir} 
                          className={styles.directoryItem}
                          onClick={() => handleSelectDirectory(dir)}
                        >
                          📁 {dir.split('/').pop()}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.noDirectories}>No accessible directories found</div>
                )}
              </div>
              
              <div className={styles.folderNameInput}>
                <label htmlFor="folder-name" className={styles.label}>
                  New Folder Name:
                </label>
                <input
                  id="folder-name"
                  type="text"
                  value={folderName}
                  onChange={handleFolderNameChange}
                  className={styles.input}
                  placeholder="Enter new folder name (e.g., my-project)"
                />
              </div>
              
              <div className={styles.actions}>
                <button 
                  className={styles.button}
                  onClick={handleCreateDirectory}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <p>Claude Code IDE - A powerful code editor in your browser</p>
        </div>
      </div>
    </div>
  );
};

export default DirectorySelector;