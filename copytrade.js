const { Connection, PublicKey } = require('@solana/web3.js');

const rpcUrl = 'https://tiniest-palpable-diagram.solana-mainnet.quiknode.pro/68883c3e540d71733aa721ebba9f729ab90652fa';
const connection = new Connection(rpcUrl, 'confirmed');
const walletAddress = new PublicKey('E7p75ggvpWVfUt6XqL8T9yneNLPjK1k4uvwZBxk18CRM');

const processedTransactions = new Set();

// Função para verificar se há compra ou venda de tokens
async function getTokenTransactions(transactionSignature) {
    try {
        const transaction = await connection.getTransaction(transactionSignature, { maxSupportedTransactionVersion: 0 });

        if (transaction && transaction.meta) {
            const preBalances = transaction.meta.preTokenBalances || [];
            const postBalances = transaction.meta.postTokenBalances || [];

            const boughtTokens = new Set();
            const soldTokens = new Set();

            // Detecta tokens comprados (compra de tokens com SOL)
            postBalances.forEach((balance) => {
                const preBalance = preBalances.find((b) => b.mint === balance.mint);
                if (!preBalance || Number(preBalance.uiTokenAmount.amount) < Number(balance.uiTokenAmount.amount)) {
                    boughtTokens.add(balance.mint);
                }
            });

            // Detecta tokens vendidos (venda de tokens por SOL)
            preBalances.forEach((balance) => {
                const postBalance = postBalances.find((b) => b.mint === balance.mint);
                if (!postBalance || Number(balance.uiTokenAmount.amount) > Number(postBalance.uiTokenAmount.amount)) {
                    soldTokens.add(balance.mint);
                }
            });

            // Exibe tokens comprados
            boughtTokens.forEach((tokenMint) => {
                console.log(`A wallet comprou o token: ${tokenMint}`);
            });

            // Exibe tokens vendidos
            soldTokens.forEach((tokenMint) => {
                console.log(`A wallet vendeu o token: ${tokenMint}`);
            });
        }
    } catch (error) {
        console.error('Erro ao processar a transação:', error);
    }
}

// Função para monitorar as transações da wallet e informar compra ou venda
async function monitorTransactions() {
    console.log(`Monitorando transações para a wallet: ${walletAddress.toBase58()}`);

    connection.onLogs(walletAddress, async (log) => {
        const transactionSignature = log.signature;

        if (processedTransactions.has(transactionSignature)) {
            console.log(`Transação ${transactionSignature} já foi processada. Ignorando...`);
            return;
        }

        processedTransactions.add(transactionSignature); // Marca a transação como processada
        console.log(`Nova transação detectada: ${transactionSignature}`);
        getTokenTransactions(transactionSignature).catch(err => console.error('Erro no processamento da transação:', err));
    }, 'confirmed');
}

// Inicia a monitorar as transações
monitorTransactions();

function cleanupOnExit() {
    console.log('Processo encerrado. Limpando...');
}

process.on('exit', cleanupOnExit);
process.on('SIGINT', () => process.exit()); 
