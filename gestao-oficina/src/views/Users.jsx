import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Pencil, Trash2, Search, X,
    ShieldCheck, User, ShieldAlert, KeyRound, Mail
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Users.css';

const emptyForm = {
    name: '', email: '', password: '', role: 'user'
};

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('Todos');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Pagination State
    const { settings } = useSettings();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = settings.items_per_page || 10;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch {
            // error handled by interceptor
            toast.error("Erro ao carregar os usuários");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filteredUsers = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === 'Todos' || u.role === filterRole;
        return matchSearch && matchRole;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const currentItems = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterRole]);

    const openCreate = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (u) => {
        setForm({
            name: u.name,
            email: u.email,
            password: '', // do not pre-fill password
            role: u.role
        });
        setEditingId(u.id);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) { 
            toast.error('Nome e E-mail são obrigatórios'); 
            return; 
        }
        
        if (!editingId && !form.password) {
            toast.error('A senha é obrigatória para novos usuários');
            return;
        }

        setSaving(true);
        try {
            const payload = { ...form };
            if (editingId) {
                // Remove password from payload if it wasn't typed (meaning: don't change it)
                if (!payload.password) {
                    delete payload.password;
                }
                await api.put(`/users/${editingId}`, payload);
                toast.success('Usuário atualizado com sucesso!');
            } else {
                await api.post('/users', payload);
                toast.success('Usuário cadastrado com sucesso!');
            }
            closeModal();
            fetchUsers();
        } catch (error) {
            // Error mapped by interceptor usually, but toast fallback
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            await api.delete(`/users/${deleteConfirm.id}`);
            toast.success('Usuário removido com sucesso!');
            setDeleteConfirm(null);
            fetchUsers();
        } catch (error) { 
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        standard: users.filter(u => u.role === 'user').length
    };

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><ShieldCheck size={24} /> Gestão de Usuários</h1>
                    <p className="page-subtitle">Cadastre e gerencie o acesso de administradores e funcionários</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={openCreate}>
                        <Plus size={18} /> Novo Usuário
                    </button>
                </div>
            </div>

            <div className="page-body">
                <div className="users-stats">
                    <div className="stat-card stat-blue">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total de Registros</div>
                    </div>
                    <div className="stat-card stat-orange">
                        <div className="stat-value">{stats.admins}</div>
                        <div className="stat-label">Administradores</div>
                    </div>
                    <div className="stat-card stat-green">
                        <div className="stat-value">{stats.standard}</div>
                        <div className="stat-label">Usuários Padrão</div>
                    </div>
                </div>

                <div className="users-filters card">
                    <div className="search-box">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                        {search && <button onClick={() => setSearch('')} className="search-clear"><X size={14} /></button>}
                    </div>
                    <div className="role-tabs">
                        {['Todos', 'admin', 'user'].map(s => (
                            <button
                                key={s}
                                className={`role-tab ${filterRole === s ? 'active' : ''}`}
                                onClick={() => setFilterRole(s)}
                            >
                                {s === 'admin' ? 'Admins' : s === 'user' ? 'Padrão' : s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="data-table-card mt-6">
                    <div className="card-header">
                        <h2 className="text-lg font-bold text-primary-color">Controle de Acessos</h2>
                        <p className="text-sm text-secondary">Gestão de permissões de usuários do sistema</p>
                    </div>
                    {loading ? (
                        <div className="p-8 flex justify-center"><div className="spinner pr-2"></div><p>Carregando...</p></div>
                    ) : filteredUsers.length === 0 ? (
                        <EmptyState
                            icon={ShieldCheck}
                            title="Nenhum usuário encontrado"
                            description="Você ainda não possui usuários cadastrados ou a busca não retornou resultados."
                            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Cadastrar</button>}
                        />
                    ) : (
                        <div className="table-responsive">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Nome / E-mail</th>
                                        <th>Perfil de Acesso</th>
                                        <th>Data de Criação</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="user-name">
                                                    <div className="avatar">{u.name.charAt(0)}</div>
                                                    <div>
                                                        <div className="name">{u.name}</div>
                                                        <div className="email">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge-role ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                                                    {u.role === 'admin' ? <ShieldCheck size={14} /> : <User size={14} />}
                                                    {u.role === 'admin' ? 'Administrador' : 'Usuário Padrão'}
                                                </span>
                                            </td>
                                            <td>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-icon btn-edit" onClick={() => openEdit(u)} title="Editar">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button className="btn-icon btn-del" onClick={() => setDeleteConfirm(u)} title="Excluir">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {filteredUsers.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={itemsPerPage}
                            totalItems={filteredUsers.length}
                        />
                    )}
                </div>
            </div>

            {/* Form Modal */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingId ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
                size="large"
                footer={(
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                        <button type="submit" form="user-form" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Registrando...' : editingId ? 'Salvar Alterações' : 'Criar Acesso'}
                        </button>
                    </div>
                )}
            >
                <form id="user-form" onSubmit={handleSave} className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <User className="text-primary-color" size={20} />
                            <h3 className="font-bold text-lg">1. Identificação</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Nome Completo *</label>
                                <div className="form-input-wrapper">
                                    <User className="input-icon" size={18} />
                                    <input name="name" value={form.name} onChange={handleChange}
                                        className="form-control form-control-with-icon" placeholder="E.g. João da Silva" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">E-mail de Acesso *</label>
                                <div className="form-input-wrapper">
                                    <Mail className="input-icon" size={18} />
                                    <input name="email" type="email" value={form.email} onChange={handleChange}
                                        className="form-control form-control-with-icon" placeholder="joao@oficina.com" required />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-4 pt-4 border-t border-color">
                            <KeyRound className="text-primary-color" size={20} />
                            <h3 className="font-bold text-lg">2. Segurança e Acesso</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Perfil de Acesso *</label>
                                <div className="form-input-wrapper">
                                    <ShieldCheck className="input-icon" size={18} />
                                    <select name="role" value={form.role} onChange={handleChange} className="form-control form-control-with-icon">
                                        <option value="user">Usuário Padrão</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Senha {editingId && <span className="text-muted text-xs font-normal">(Opcional)</span>}</label>
                                <div className="form-input-wrapper">
                                    <KeyRound className="input-icon" size={18} />
                                    <input name="password" type="password" value={form.password} onChange={handleChange}
                                        className="form-control form-control-with-icon" placeholder={editingId ? "Manter atual" : "Digite uma senha"} 
                                        required={!editingId} 
                                    />
                                </div>
                            </div>
                        </div>

                        {form.role === 'admin' && (
                            <div className="info-alert mt-4">
                                <ShieldAlert size={20} />
                                <p>
                                    <strong>Atenção:</strong> Administradores têm acesso irrestrito a todas as funções, configurações e painéis financeiros do sistema.
                                </p>
                            </div>
                        )}
                    </div>
                </form>
            </Modal>

             {/* Delete Confirm Modal */}
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Revogar Acesso"
                message={`Deseja realmente excluir o acesso de ${deleteConfirm?.name}?`}
                itemName={deleteConfirm?.email}
                isLoading={saving}
                confirmText="Sim, Revogar Acesso"
            />
        </div>
    );
}
