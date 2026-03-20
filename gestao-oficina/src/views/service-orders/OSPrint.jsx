import React from 'react';
import { formatDate, formatMoney } from '../../utils/format';

const OSPrint = ({ os, settings }) => {
    if (!os) return null;

    const parts = os.parts || [];

    return (
        <div className="print-document" style={{ backgroundColor: '#ffffff', color: '#000000', padding: '10px', minHeight: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {settings?.logo_url && (
                        <div style={{ width: '80px', flexShrink: 0 }}>
                            <img src={settings.logo_url} alt="Logo" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain' }} />
                        </div>
                    )}
                    <div>
                        <h1 style={{ fontSize: '24px', margin: 0 }}>{settings?.workshop_name || 'Nome da Oficina'}</h1>
                        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>{settings?.workshop_address}</p>
                        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>{settings?.workshop_phone} {settings?.workshop_document && `| CNPJ/CPF: ${settings.workshop_document}`}</p>
                        <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Ordem de Serviço #{os.id}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p><strong>Data:</strong> {formatDate(os.created_at)}</p>
                    <p><strong>Status:</strong> {os.status?.toUpperCase()}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                <div>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px', color: '#333' }}>CLIENTE</h3>
                    <p><strong>Nome:</strong> {os.client_name}</p>
                    {os.client_document && <p><strong>CPF/CNPJ:</strong> {os.client_document}</p>}
                    {os.client_phone && <p><strong>Telefone:</strong> {os.client_phone}</p>}
                </div>
                <div>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px', color: '#333' }}>VEÍCULO</h3>
                    <p><strong>Fabricante:</strong> {os.brand || '--'}</p>
                    <p><strong>Modelo:</strong> {os.vehicle_model}</p>
                    <p><strong>Placa:</strong> {os.plate}</p>
                    {os.vehicle_km && <p><strong>KM na Entrada do Veículo:</strong> {Number(os.vehicle_km).toLocaleString('pt-BR')} km</p>}
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px', color: '#333' }}>SERVIÇO SOLICITADO / PROBLEMA</h3>
                <p style={{ padding: '10px', background: '#f9f9f9', whiteSpace: 'pre-wrap', borderRadius: '4px', border: '1px solid #eee' }}>{os.problem_reported}</p>
            </div>

            {os.service_provided && (
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px', color: '#333' }}>SERVIÇO EXECUTADO</h3>
                    <p style={{ padding: '10px', background: '#f9f9f9', whiteSpace: 'pre-wrap', borderRadius: '4px', border: '1px solid #eee' }}>{os.service_provided}</p>
                </div>
            )}

            {parts.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px', color: '#333' }}>PEÇAS E MATERIAIS</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '5px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '8px 4px', fontSize: '12px' }}>Cód.</th>
                                <th style={{ padding: '8px 4px', fontSize: '12px' }}>Descrição</th>
                                <th style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center' }}>Qtd.</th>
                                <th style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'right' }}>Unitário</th>
                                <th style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parts.map((part, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '8px 4px', fontSize: '12px', color: '#666' }}>{part.part_code || '--'}</td>
                                    <td style={{ padding: '8px 4px', fontSize: '12px' }}>{part.part_name}</td>
                                    <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center' }}>{part.quantity}</td>
                                    <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'right' }}>{formatMoney(part.unit_price)}</td>
                                    <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(part.total_price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ marginTop: '50px', borderTop: '2px solid #333', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#333' }}>RESUMO DE VALORES</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Mão de Obra:</span>
                    <span>{formatMoney(os.labor_cost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Peças/Materiais:</span>
                    <span>{formatMoney(os.parts_cost)}</span>
                </div>
                {os.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#d32f2f' }}>
                        <span>Desconto:</span>
                        <span>- {formatMoney(os.discount)}</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ddd', fontSize: '18px', fontWeight: 'bold' }}>
                    <span>TOTAL:</span>
                    <span>{formatMoney(os.total_cost)}</span>
                </div>
            </div>

            <div style={{ marginTop: '100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
                    <p style={{ fontSize: '12px' }}>Assinatura do Cliente</p>
                </div>
                <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
                    <p style={{ fontSize: '12px' }}>{os.mechanic_name || 'Assinatura do Responsável'}</p>
                </div>
            </div>
        </div>
    );
};

export default OSPrint;
