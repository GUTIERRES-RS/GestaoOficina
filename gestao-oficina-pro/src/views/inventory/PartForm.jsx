import React from 'react';
import { Loader, Settings, Hash, Layers, Truck, AlignLeft, Package, AlertTriangle, DollarSign } from 'lucide-react';

const PartForm = ({ formData, onChange, onSubmit, isSubmitting, isEditMode }) => {
    return (
        <form onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                    <label className="form-label">Nome da Peça *</label>
                    <div className="form-input-wrapper">
                        <Settings className="input-icon" size={18} />
                        <input
                            type="text"
                            className="form-control form-control-with-icon"
                            placeholder="Ex: Filtro de Óleo"
                            required
                            value={formData.name}
                            onChange={(e) => onChange({ name: e.target.value })}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Código (Opcional)</label>
                    <div className="form-input-wrapper">
                        <Hash className="input-icon" size={18} />
                        <input
                            type="text"
                            className="form-control form-control-with-icon"
                            placeholder="Ex: FLT-123"
                            value={formData.code}
                            onChange={(e) => onChange({ code: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <div className="form-input-wrapper">
                        <Layers className="input-icon" size={18} />
                        <select
                            className="form-control form-control-with-icon"
                            value={formData.category}
                            onChange={(e) => onChange({ category: e.target.value })}
                        >
                            <option value="">Sem categoria</option>
                            <option value="Motor">Motor</option>
                            <option value="Suspensão">Suspensão</option>
                            <option value="Freios">Freios</option>
                            <option value="Filtros">Filtros</option>
                            <option value="Fluidos">Fluidos</option>
                            <option value="Elétrica">Elétrica</option>
                            <option value="Acessórios">Acessórios</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Fornecedor Preferencial</label>
                    <div className="form-input-wrapper">
                        <Truck className="input-icon" size={18} />
                        <input
                            type="text"
                            className="form-control form-control-with-icon"
                            placeholder="Nome do Fornecedor..."
                            value={formData.supplier}
                            onChange={(e) => onChange({ supplier: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="form-group mb-4">
                <label className="form-label">Descrição</label>
                <div className="form-input-wrapper items-start">
                    <AlignLeft className="input-icon mt-3" size={18} />
                    <textarea
                        className="form-control form-control-with-icon"
                        rows="2"
                        placeholder="Detalhes ou aplicação da peça..."
                        value={formData.description}
                        onChange={(e) => onChange({ description: e.target.value })}
                    ></textarea>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                    <label className="form-label">Qtd. em Estoque *</label>
                    <div className="form-input-wrapper">
                        <Package className="input-icon" size={18} />
                        <input
                            type="number"
                            min="0"
                            className="form-control form-control-with-icon"
                            placeholder="0"
                            required
                            value={formData.stock_quantity}
                            onChange={(e) => onChange({ stock_quantity: e.target.value })}
                            disabled={isEditMode} /* Prevents manual stock overwrite during edit; use adjustment */
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Estoque Mínimo *</label>
                    <div className="form-input-wrapper">
                        <AlertTriangle className="input-icon" size={18} />
                        <input
                            type="number"
                            min="0"
                            className="form-control form-control-with-icon"
                            placeholder="Aviso de baixo estoque"
                            required
                            value={formData.min_stock}
                            onChange={(e) => onChange({ min_stock: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="form-group">
                    <label className="form-label">Preço de Custo (R$) *</label>
                    <div className="form-input-wrapper">
                        <DollarSign className="input-icon" size={18} />
                        <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-with-icon"
                            placeholder="0.00"
                            required
                            value={formData.cost_price}
                            onChange={(e) => onChange({ cost_price: e.target.value })}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Preço de Venda (R$) *</label>
                    <div className="form-input-wrapper">
                        <DollarSign className="input-icon" size={18} />
                        <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-with-icon"
                            placeholder="0.00"
                            required
                            value={formData.sale_price}
                            onChange={(e) => onChange({ sale_price: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-color">
                <button type="button" className="btn btn-secondary" onClick={() => onChange({ cancel: true })}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <Loader className="animate-spin" size={16} /> : (isEditMode ? 'Atualizar Peça' : 'Salvar Peça')}
                </button>
            </div>
        </form>
    );
};


export default PartForm;
