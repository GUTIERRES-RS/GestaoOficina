import React from 'react';
import { Loader, Hash, Car, Layers, Calendar, Disc, Activity, AlignLeft } from 'lucide-react';

const BRANDS = [
    'Chevrolet', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jeep', 'Mitsubishi',
    'Nissan', 'Peugeot', 'Renault', 'Toyota', 'Volkswagen', 'Volvo', 'BMW',
    'Mercedes-Benz', 'Audi', 'Kia', 'Citroën', 'Dodge', 'RAM', 'Outra'
];

const VehicleForm = ({ formData, onChange, onSubmit, isSubmitting }) => {
    return (
        <form onSubmit={onSubmit}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">Placa *</label>
                        <div className="form-input-wrapper">
                            <Hash className="input-icon" size={18} />
                            <input
                                type="text"
                                name="plate"
                                className="form-control form-control-with-icon uppercase-input"
                                style={{ textTransform: 'uppercase' }}
                                required
                                placeholder="ABC-1234"
                                value={formData.plate}
                                onChange={onChange}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Marca *</label>
                        <div className="form-input-wrapper">
                            <Car className="input-icon" size={18} />
                            <select
                                name="brand"
                                className="form-control form-control-with-icon"
                                required
                                value={formData.brand}
                                onChange={onChange}
                            >
                                <option value="">Selecione...</option>
                                {BRANDS.map(brand => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">Modelo *</label>
                        <div className="form-input-wrapper">
                            <Layers className="input-icon" size={18} />
                            <input
                                type="text"
                                name="model"
                                className="form-control form-control-with-icon"
                                required
                                placeholder="Ex: Onix"
                                value={formData.model}
                                onChange={onChange}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Ano</label>
                        <div className="form-input-wrapper">
                            <Calendar className="input-icon" size={18} />
                            <input
                                type="text"
                                name="year"
                                className="form-control form-control-with-icon"
                                placeholder="Ex: 2020"
                                value={formData.year}
                                onChange={onChange}
                            />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">Cor</label>
                        <div className="form-input-wrapper">
                            <Disc className="input-icon" size={18} />
                            <input
                                type="text"
                                name="color"
                                className="form-control form-control-with-icon"
                                placeholder="Ex: Branco"
                                value={formData.color}
                                onChange={onChange}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">KM no Cadastro</label>
                        <div className="form-input-wrapper">
                            <Activity className="input-icon" size={18} />
                            <input
                                type="number"
                                name="km_cad"
                                className="form-control form-control-with-icon"
                                placeholder="Ex: 50000"
                                value={formData.km_cad}
                                onChange={onChange}
                            />
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Observações do Veículo</label>
                    <div className="form-input-wrapper items-start">
                        <AlignLeft className="input-icon mt-3" size={18} />
                        <textarea
                            name="notes"
                            className="form-control form-control-with-icon"
                            rows="3"
                            placeholder="Detalhes técnicos ou de conservação..."
                            value={formData.notes}
                            onChange={onChange}
                        ></textarea>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-color">
                <button type="submit" className="btn btn-primary px-8" disabled={isSubmitting}>
                    {isSubmitting ? <Loader className="animate-spin" size={18} /> : 'Cadastrar Veículo'}
                </button>
            </div>
        </form>
    );
};

export default VehicleForm;
