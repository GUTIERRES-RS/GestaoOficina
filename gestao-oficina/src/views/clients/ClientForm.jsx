import React from 'react';
import { Loader, User, Phone, Hash, Mail, MapPin, AlignLeft } from 'lucide-react';

const ClientForm = ({ formData, onChange }) => {
    return (
        <div className="space-y-4">
            <div className="form-group">
                <label className="form-label">Nome Completo / Razão Social *</label>
                <div className="form-input-wrapper">
                    <User className="input-icon" size={18} />
                    <input
                        type="text"
                        name="name"
                        className="form-control form-control-with-icon"
                        required
                        placeholder="Ex: João Silva ou Oficina do Zé"
                        value={formData.name}
                        onChange={onChange}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="form-label">Telefone / WhatsApp *</label>
                    <div className="form-input-wrapper">
                        <Phone className="input-icon" size={18} />
                        <input
                            type="text"
                            name="phone"
                            className="form-control form-control-with-icon"
                            required
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={onChange}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">CPF / CNPJ</label>
                    <div className="form-input-wrapper">
                        <Hash className="input-icon" size={18} />
                        <input
                            type="text"
                            name="document"
                            className="form-control form-control-with-icon"
                            placeholder="000.000.000-00"
                            value={formData.document}
                            onChange={onChange}
                        />
                    </div>
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">E-mail</label>
                <div className="form-input-wrapper">
                    <Mail className="input-icon" size={18} />
                    <input
                        type="email"
                        name="email"
                        className="form-control form-control-with-icon"
                        placeholder="cliente@email.com"
                        value={formData.email}
                        onChange={onChange}
                    />
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Endereço</label>
                <div className="form-input-wrapper">
                    <MapPin className="input-icon" size={18} />
                    <input
                        type="text"
                        name="address"
                        className="form-control form-control-with-icon"
                        placeholder="Rua, número, bairro..."
                        value={formData.address}
                        onChange={onChange}
                    />
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Observações Internas</label>
                <div className="form-input-wrapper items-start">
                    <AlignLeft className="input-icon mt-3" size={18} />
                    <textarea
                        name="notes"
                        className="form-control form-control-with-icon"
                        rows="3"
                        placeholder="Detalhes importantes sobre o cliente..."
                        value={formData.notes}
                        onChange={onChange}
                    ></textarea>
                </div>
            </div>
        </div>
    );
};

export default ClientForm;
