import React from 'react';
import { formatDate, formatMoney } from '../../utils/format';

const OSPrint = ({ os, settings }) => {
    if (!os) return null;

    const parts = os.parts || [];

    return (
        <div className="print-document">
            <div className="print-header">
                <div className="print-header-info">
                    {settings?.logo_url && (
                        <div className="print-logo-container">
                            <img src={settings.logo_url} alt="Logo" className="print-logo" />
                        </div>
                    )}
                    <div>
                        <h1 className="print-title">{settings?.workshop_name || 'Nome da Oficina'}</h1>
                        <p className="print-subtitle">{settings?.workshop_address}</p>
                        <p className="print-subtitle">{settings?.workshop_phone} {settings?.workshop_document && `| CNPJ/CPF: ${settings.workshop_document}`}</p>
                        <p className="print-os-id">Ordem de Serviço #{os.id}</p>
                    </div>
                </div>
                <div className="print-meta-right">
                    <p><strong>Data:</strong> {formatDate(os.created_at)}</p>
                    <p><strong>Status:</strong> {os.status?.toUpperCase()}</p>
                </div>
            </div>

            <div className="print-grid">
                <div>
                    <h3 className="print-section-title">CLIENTE</h3>
                    <p><strong>Nome:</strong> {os.client_name}</p>
                    {os.client_document && <p><strong>CPF/CNPJ:</strong> {os.client_document}</p>}
                    {os.client_phone && <p><strong>Telefone:</strong> {os.client_phone}</p>}
                </div>
                <div>
                    <h3 className="print-section-title">VEÍCULO</h3>
                    <p><strong>Fabricante:</strong> {os.brand || '--'}</p>
                    <p><strong>Modelo:</strong> {os.vehicle_model}</p>
                    <p><strong>Placa:</strong> {os.plate}</p>
                    {os.vehicle_km && <p><strong>KM na Entrada do Veículo:</strong> {Number(os.vehicle_km).toLocaleString('pt-BR')} km</p>}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="print-section-title">SERVIÇO SOLICITADO / PROBLEMA</h3>
                <p className="print-content-box">{os.problem_reported}</p>
            </div>

            {os.service_provided && (
                <div className="mb-4">
                    <h3 className="print-section-title">SERVIÇO EXECUTADO</h3>
                    <p className="print-content-box">{os.service_provided}</p>
                </div>
            )}

            {parts.length > 0 && (
                <div className="mb-4">
                    <h3 className="print-section-title">PEÇAS E MATERIAIS</h3>
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th>Cód.</th>
                                <th>Descrição</th>
                                <th className="text-center">Qtd.</th>
                                <th className="text-right">Unitário</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parts.map((part, index) => (
                                <tr key={index}>
                                    <td>{part.part_code || '--'}</td>
                                    <td>{part.part_name}</td>
                                    <td className="text-center">{part.quantity}</td>
                                    <td className="text-right">{formatMoney(part.unit_price)}</td>
                                    <td className="text-right"><strong>{formatMoney(part.total_price)}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="print-summary">
                <h3 className="print-section-title">RESUMO DE VALORES</h3>
                <div className="print-summary-row">
                    <span>Mão de Obra:</span>
                    <span>{formatMoney(os.labor_cost)}</span>
                </div>
                <div className="print-summary-row">
                    <span>Peças/Materiais:</span>
                    <span>{formatMoney(os.parts_cost)}</span>
                </div>
                {os.discount > 0 && (
                    <div className="print-summary-row text-danger">
                        <span>Desconto:</span>
                        <span>- {formatMoney(os.discount)}</span>
                    </div>
                )}
                <div className="print-summary-total">
                    <span>TOTAL:</span>
                    <span>{formatMoney(os.total_cost)}</span>
                </div>
            </div>

            <div className="print-signatures">
                <div className="print-signature-line">
                    <p>Assinatura do Cliente</p>
                </div>
                <div className="print-signature-line">
                    <p>{os.mechanic_name || 'Assinatura do Responsável'}</p>
                </div>
            </div>
        </div>
    );
};

export default OSPrint;
