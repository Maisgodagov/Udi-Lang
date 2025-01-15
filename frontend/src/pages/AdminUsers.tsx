import React, { useState, useEffect } from 'react';
import './AdminUsers.css';
import api from '../services/axiosConfig'; // Путь к вашему файлу

interface UsersListEntry {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'translator' | 'user';
  created_at : string;
}

const AdminUsers: React.FC = () => {
    const [usersList, setUsersList] = useState<UsersListEntry[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [userRoleEdit, setUserRoleEdit] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
        const response = await api.get('/user/users');
        setUsersList(response.data);
        console.log(response)
        } catch (err) { console.log(err)}
    }
    const handleEdit = (entry: UsersListEntry) => {
        setEditingId(entry.id);
        setUserRoleEdit(entry.role);
    };
    const handleSave = async (id: number) => {
        try {
            await api.put(`/user/users/${id}`, { role: userRoleEdit });
            setSuccessMessage('Роль обновлена успешно');
            setEditingId(null);
            fetchUsers();
        } catch (err) {
            setError('Ошибка при изменении роли');
            console.error(err);
        }
    }
    const handleCancelEdit = () => {
        setEditingId(null);
        setUserRoleEdit('');
    }
    return (
        <div className="dictionary-wrapper">
        <h1 className="section-title">Пользователи</h1>
        {error && <p className="error-msg">{error}</p>}
        {successMessage && <p className="success-msg">{successMessage}</p>}
        <ul className="admin-users-list">
        {usersList.map((entry) => (
            <li key={entry.id} className='admin-users-item'>
                <div className="admin-user-wrapper">
                    <span className='user-item-id'>{entry.id}</span>
                    <span className='user-item-name'>{entry.username}</span>
                    <span className='user-item-email'>{entry.email}</span>
                    {editingId === entry.id ? (
                        <input
                            className='word-edit-input'
                            placeholder='Роль'
                            type="text"
                            value={userRoleEdit}
                            onChange={(e) => setUserRoleEdit(e.target.value)}
                        />
                        ) : (
                            <span className='user-item-role'>{entry.role}</span>
                        )}
                    {editingId === entry.id ? (
                        <>
                        <button
                            className="word-save-btn"
                            onClick={() => handleSave(entry.id)}
                        >
                            Сохр.
                        </button>
                        <button
                            className="word-cancel-btn"
                            onClick={handleCancelEdit}
                        >
                            Отм.
                        </button>
                        </>
                    ) : (
                        <>
                        <button
                            className="edit-btn"
                            onClick={() => handleEdit(entry)}
                        >
                            Изменить роль
                        </button>
                        </>
                    )}
                </div>
                <div className="admin-user-stat-wrapper">

                </div>
            
            </li>
        ))}
        </ul>
        </div>
    );
};

export default AdminUsers;
