import React from 'react';
import { formatDate, formatMoney } from '../../utils/format';

const OSPrint = ({ os, settings }) => {
    if (!os) return null;

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
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>CLIENTE</h3>
                    <p><strong>Nome:</strong> {os.client_name}</p>
                    {os.client_document && <p><strong>CPF/CNPJ:</strong> {os.client_document}</p>}
                </div>
                <div>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>VEÍCULO</h3>
                    <p><strong>Fabricante:</strong> {os.brand || '--'}</p>
                    <p><strong>Modelo:</strong> {os.vehicle_model}</p>
                    <p><strong>Placa:</strong> {os.plate}</p>
                    {os.vehicle_km && <p><strong>KM na Entrada do Veículo:</strong> {Number(os.vehicle_km).toLocaleString('pt-BR')} km</p>}
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>SERVIÇO SOLICITADO / PROBLEMA</h3>
                <p style={{ padding: '10px', background: '#f9f9f9', whiteSpace: 'pre-wrap' }}>{os.problem_reported}</p>
            </div>

            {os.service_provided && (
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>SERVIÇO EXECUTADO</h3>
                    <p style={{ padding: '10px', background: '#f9f9f9', whiteSpace: 'pre-wrap' }}>{os.service_provided}</p>
                </div>
            )}

            <div style={{ marginTop: '50px', borderTop: '2px solid #333', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>RESUMO DE VALORES</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Mão de Obra:</span>
                    <span>{formatMoney(os.labor_cost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Peças/Materiais:</span>
                    <span>{formatMoney(os.parts_cost)}</span>
                </div>
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
