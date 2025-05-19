import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constents';

export const TransactionContext = React.createContext();

const { ethereum } = window;
const getEthereumContract = async () => {
    if (!window.ethereum) {
        throw new Error("No Ethereum object found. Install MetaMask.");
    }


    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', [])
    const signer = await provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

    return { provider, signer, transactionContract };

}
export const TransactionProvider = ({ children }) => {

    const [currentAccount, setCurrentAccount] = useState('');
    const [formData, setFromData] = useState({ addressTo: '', amount: '', keyword: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(
        parseInt(localStorage.getItem('transactionCount')) || 0
    );
    const [transactions, setTransactions] = useState([]);



    const handleChange = (e, name) => {
        setFromData((prevState) => ({ ...prevState, [name]: e.target.value }));
    }

    const getAllTransactions = async () => {
        try {
            if (!window.ethereum) {
                return alert("Please install metamask");
            }
            const { transactionContract } = await getEthereumContract();
            const availableTransactions = await transactionContract.getAllTransactions();
            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(Number(transaction.timestamp.toString()) * 1000).toLocaleString(),

                message: transaction.message,
                keyword: transaction.keyword,
                amount: ethers.formatEther(transaction.amount),

            }));
            console.log(structuredTransactions);
            setTransactions(structuredTransactions);
            console.log(availableTransactions)

        } catch (error) {
            console.log(error);
        }
    };


    const checkIfWalletIsConnected = async () => {


        try {

            if (!window.ethereum) return alert("Please install metamask");

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length) {
                setCurrentAccount(accounts[0]);
                getAllTransactions();

            } else {
                console.log('No accounts found');

            }

        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object.")
        }



    }

    const checkIfTransactionsExist = async () => {
        try {
            const { signer, transactionContract } = await getEthereumContract();
            const transactionCount = await transactionContract.getTransactionCount();
            window.localStorage.setItem("transactionCount", transactionCount.toString());

        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object.")
        }
    }

    const connectWallet = async () => {
        try {
            if (!window.ethereum) return alert("Please install metamask");
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setCurrentAccount(accounts[0]);
            console.log("Wallet connected:", accounts[0]);
        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object.")
        }
    }

    const sendTransaction = async () => {
        try {
            if (!window.ethereum) return alert("Please install MetaMask");

            const { addressTo, amount, keyword, message } = formData;
            const { signer, transactionContract } = await getEthereumContract();
            const parsedAmount = ethers.parseEther(amount);

            const tx = await signer.sendTransaction({
                to: addressTo,
                value: parsedAmount,

            });
            console.log(`Native transfer tx hash: ${tx.hash}`);

            const transactionHash = await transactionContract.addToBlockChain(addressTo, parsedAmount, message, keyword);
            setIsLoading(true);
            console.log(`Contract tx loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            setIsLoading(false);
            console.log(`Contract tx success - ${transactionHash.hash}`);
            const transactionCount = await transactionContract.getTransactionCount();
            setTransactionCount(Number(transactionCount));
            window.reload();
        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object. ");
        }
    }
    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExist();
    }, []);

    return (
        <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, sendTransaction, handleChange, transactions, isLoading }}>
            {children}
        </TransactionContext.Provider>
    );
}