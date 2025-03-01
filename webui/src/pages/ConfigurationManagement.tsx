import React, { useState, useEffect } from 'react';
import { Typography, Paper, Tabs, Tab, Box, CircularProgress, TextField, Button, Snackbar, Alert } from '@mui/material';
import { apiClient } from '../services/api';
import ConfigEditor from '../components/ConfigEditor';

interface ConfigManifest {
  [key: string]: {
    Value: string;
    Version: number;
  };
}

const resourceTypes = [
  { key: 'ClassPlans', label: '课表' },
  { key: 'TimeLayouts', label: '时间布局' },
  { key: 'SubjectsSource', label: '科目' },
  { key: 'DefaultSettingsSource', label: '默认设置' },
  { key: 'PolicySource', label: '策略' },
];

const ConfigurationManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [configNames, setConfigNames] = useState<string[]>([]);
  const [selectedConfigName, setSelectedConfigName] = useState<string | null>(null);
  const [configContent, setConfigContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [isEditing, setIsEditing] = useState(false);

  const currentResourceType = resourceTypes[tabValue].key;

  useEffect(() => {
    fetchConfigNames(currentResourceType);
  }, [tabValue, currentResourceType]);

  const fetchConfigNames = async (resourceType: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/panel/${resourceType}`);
      setConfigNames(response.data);
      if (response.data.length > 0) {
        setSelectedConfigName(response.data[0]);
      } else {
        setSelectedConfigName(null);
      }
    } catch (error) {
      console.error("Failed to fetch config names:", error);
      setConfigNames([]);
      setSelectedConfigName(null);
      handleSnackbarOpen('获取配置文件列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedConfigName) {
      fetchConfigContent(currentResourceType, selectedConfigName);
    } else {
      setConfigContent('');
    }
  }, [selectedConfigName, currentResourceType]);

  const fetchConfigContent = async (resourceType: string, name: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/client/${resourceType.slice(0, -1)}?name=${name}`);
      setConfigContent(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error("Failed to fetch config content:", error);
      setConfigContent('');
      handleSnackbarOpen('获取配置文件内容失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedConfigName(null);
  };

  const handleConfigNameClick = (name: string) => {
    setSelectedConfigName(name);
    setIsEditing(false); // 点击新配置时取消编辑状态
  };

  const handleSaveConfig = async (content: string) => {
    if (!selectedConfigName) return;
    setLoading(true);
    try {
      await apiClient.post(`/api/resources/${currentResourceType}/${selectedConfigName}`, { content: JSON.parse(content) });
      handleSnackbarOpen('配置文件保存成功', 'success');
      setIsEditing(false); // 保存后退出编辑状态
    } catch (error) {
      console.error("Failed to save config:", error);
      handleSnackbarOpen('配置文件保存失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarOpen = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleAddConfig = () => {
    // TODO: 实现新增配置文件的逻辑，例如弹窗输入新配置名称，然后打开编辑器
    alert('新增配置功能待实现');
  };

  const handleDeleteConfig = () => {
    // TODO: 实现删除配置文件的逻辑，需要后端API支持
    if (selectedConfigName) {
      alert(`删除配置 ${selectedConfigName} 功能待实现`);
    } else {
      alert('请先选择要删除的配置文件');
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        配置管理
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} aria-label="resource types tabs">
        {resourceTypes.map((type, index) => (
          <Tab key={type.key} label={type.label} />
        ))}
      </Tabs>

      <Paper elevation={2} style={{ marginTop: 20, padding: 20, display: 'flex' }}>
        <Box width={250} marginRight={2}>
          <Typography variant="h6" gutterBottom>配置文件列表</Typography>
          {loading && tabValue === tabValue ? ( // 使用 tabValue 进行条件渲染
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <CircularProgress size={24} />
            </div>
          ) : (
            <ListGroup>
              {configNames.map((name) => (
                <ListItem
                  key={name}
                  selected={selectedConfigName === name}
                  onClick={() => handleConfigNameClick(name)}
                >
                  {name}
                </ListItem>
              ))}
            </ListGroup>
          )}
           <Box mt={2}>
              <Button variant="contained" color="primary" onClick={handleAddConfig} sx={{ mr: 1 }}>
                新增
              </Button>
              <Button variant="outlined" color="error" onClick={handleDeleteConfig} disabled={!selectedConfigName}>
                删除
              </Button>
            </Box>
        </Box>

        <Box flex={1}>
          <Typography variant="h6" gutterBottom>配置文件内容</Typography>
          {loading && selectedConfigName ? (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <CircularProgress size={24} />
            </div>
          ) : (
            <ConfigEditor
              value={configContent}
              onChange={setConfigContent}
              onSave={handleSaveConfig}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
            />
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

interface ListGroupProps {
  children: React.ReactNode;
}

const ListGroup: React.FC<ListGroupProps> = ({ children }) => (
  <Paper style={{ maxHeight: 400, overflow: 'auto' }}>
    <Box component="ul" sx={{ listStyle: 'none', p: 1, m: 0 }}>
      {children}
    </Box>
  </Paper>
);


interface ListItemProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

const ListItem: React.FC<ListItemProps> = ({ children, selected, onClick }) => (
  <Box component="li" sx={{
    padding: '8px 16px',
    cursor: 'pointer',
    backgroundColor: selected ? 'action.selected' : 'inherit',
    '&:hover': {
      backgroundColor: 'action.hover',
    },
  }}
    onClick={onClick}
  >
    {children}
  </Box>
);


export default ConfigurationManagement;