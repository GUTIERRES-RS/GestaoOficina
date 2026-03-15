# 🛠️ Gestão de Oficina Pro

Sistema administrativo completo e moderno para gestão de oficinas mecânicas, focado em alta produtividade, controle financeiro rigoroso e gestão inteligente de inventário.

![Dashboard Preview](Dashboard-claro.png)
![Dashboard Preview](Dashboard-escuro.png)

## 🚀 Principais Funcionalidades

### 📋 Gestão de Ordens de Serviço (O.S.)
- **Fluxo Transacional**: Edição de serviços e peças com modo de rascunho. As alterações só são salvas ao confirmar, permitindo descartar rascunhos sem afetar o estoque real.
- **Cálculo Automático**: Totais de mão de obra e peças atualizados em tempo real com suporte a descontos.
- **Impressão Profissional**: Geração de documentos prontos para entrega ao cliente.

### 📦 Controle de Inventário Inteligente
- **Baixa Automática**: Integração direta com a O.S. — o estoque é reservado e baixado automaticamente no salvamento.
- **Histórico de Movimentações**: Registro detalhado de cada entrada e saída, com motivo e referência da O.S.
- **Verificação de Disponibilidade**: Validação em nível de banco de dados para evitar vendas de produtos sem estoque.

### 👥 Clientes e Frota
- **Cadastro Centralizado**: Gestão completa de clientes e seus respectivos veículos.
- **Histórico por Veículo**: Visualize rapidamente todos os serviços realizados em um veículo específico para diagnósticos mais precisos.

### 💰 Gestão Financeira
- **Fluxo de Caixa**: Geração automática de contas a receber ao finalizar ordens de serviço.
- **Relatórios de Desempenho**: Acompanhamento de faturamento e produtividade da equipe.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Banco de Dados**: [MySQL](https://www.mysql.com/)
- **Estilização**: CSS Vanilla com foco em Design Premium e Responsividade
- **Ícones**: [Lucide React](https://lucide.dev/)

## ⚙️ Configuração do Ambiente

### Pré-requisitos
- Node.js (v14 ou superior)
- MySQL Server

### 1. Clonar o Repositório
```bash
git clone https://github.com/GUTIERRES-RS/GestaoOficina.git
cd GestaoOficina
```

### 2. Configurar o Banco de Dados
- Importe o arquivo SQL localizado em `/MySQL/init.sql` para o seu servidor MySQL.
- Configure as credenciais no arquivo `.env` dentro da pasta `gestao-oficina-pro-api`.

### 3. Instalação e Execução

**Backend:**
```bash
cd gestao-oficina-pro-api
npm install
npm start
```

**Frontend:**
```bash
cd gestao-oficina-pro
npm install
npm run dev
```

## 📖 Guia de Operação

1. **Início**: O Dashboard apresenta um resumo rápido das operações do mês.
2. **Abrir O.S.**: Vá em "Serviços", selecione o cliente e o veículo. Adicione o problema relatado.
3. **Adicionar Peças**: Dentro da O.S., use o campo de busca de peças. Você pode ajustar quantidades livremente.
4. **Salvar/Descartar**: Se desistir das alterações, basta fechar o modal ou clicar em "Descartar". Nada será alterado no banco de dados. Ao clicar em "Salvar", o sistema valida o estoque e finaliza a transação.
5. **Finalização**: Mude o status para "Entregue" para gerar automaticamente o registro financeiro de entrada.

---
Desenvolvido com foco na eficiência automotiva. 🚗💨
