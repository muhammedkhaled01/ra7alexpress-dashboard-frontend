import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import axios from '@/axios';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import Loader from '@/components/Loader';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { formatDecimalValue } from '@/utils/helpers';

export default function Wallet() {
    const { id: merchantId } = useParams();
    const { t } = useTranslation();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [filters, setFilters] = useState(() => {
        const today = format(new Date(Date.now()), 'yyyy-MM-dd');
        return {
            startDate: today,
            endDate: today,
            type: 'all'
        };
    });
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const { decimalPrecision } = useSelector((state) => state.setting);

    Wallet.propTypes = {
        merchantId: PropTypes.number.isRequired
    };
    useEffect(() => {
        if (transactions.length > 0) {
            const updatedTransactions = transactions.map(tx => ({
                ...tx,
                amount: parseFloat(tx.amount)
            }));
            setTransactions(updatedTransactions);
        }
    }, [decimalPrecision]);

    const fetchWallet = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/accounts/merchant/${merchantId}`, {
                params: {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    type: filters.type
                }
            });
            if (response.data.success) {
                const numericBalance = parseFloat(response.data.data.balance);
                const numericTransactions = response.data.data.transactions.map(tx => ({
                    ...tx,
                    amount: parseFloat(tx.amount)
                }));

                setBalance(numericBalance);
                setTransactions(numericTransactions);
            }
            setLoading(false);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Error fetching wallet data'));
            setLoading(false);
        }
    }, [merchantId, filters.startDate, filters.endDate, filters.type, t]);

    const handleTransaction = async () => {
        if (!amount) return;

        try {
            setLoading(true);
            const response = await axios.post(`/accounts/merchant/${merchantId}/withdraw`, {
                amount: parseFloat(amount),
                description: t('Manual withdrawal')
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setAmount('');
                fetchWallet();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('Transaction failed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet, merchantId]);

    const formattedTransactions = useMemo(() => {
        return transactions.map(tx => ({
            ...tx,
            amount: parseFloat(tx.amount),
            created_at: format(new Date(tx.created_at), 'MMM dd, yyyy')
        }));
    }, [transactions]);

    return (
        <div className="p-6 space-y-6">
            {/* Balance Card */}
            <div className="md:w-[300px]">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h2 className="text-2xl font-bold tracking-tight">{t('Balance')}</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            ${formatDecimalValue(balance, decimalPrecision)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction Form */}
            <div className="md:w-[600px]">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h2 className="text-2xl font-bold tracking-tight">
                            {t('Withdraw')}
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">{t('Amount')}</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder={t('Enter amount')}
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleTransaction}
                                disabled={!amount || loading}
                                className="w-full"
                            >
                                {loading ? t('Processing...') : t('Withdraw')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <div className="space-y-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h2 className="text-2xl font-bold tracking-tight">{t('Transactions')}</h2>
                        <div className="flex items-center gap-2">
                            <div className="space-y-2">
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => {
                                        setFilters({ ...filters, startDate: e.target.value });
                                        fetchWallet();
                                    }}
                                    placeholder={t('From')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => {
                                        setFilters({ ...filters, endDate: e.target.value });
                                        fetchWallet();
                                    }}
                                    placeholder={t('To')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Select
                                    value={filters.type}
                                    onValueChange={(value) => {
                                        setFilters({ ...filters, type: value });
                                        fetchWallet();
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by type')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All')}</SelectItem>
                                        <SelectItem value="withdrawal">{t('Withdrawals')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Date')}</TableHead>
                                        <TableHead>{t('Type')}</TableHead>
                                        <TableHead>{t('Amount')}</TableHead>
                                        <TableHead>{t('Description')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center">
                                                <Loader />
                                            </TableCell>
                                        </TableRow>
                                    ) : formattedTransactions.length > 0 ? (
                                        formattedTransactions.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell className="font-medium">
                                                    {transaction.created_at}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={transaction.type === 'deposit' ? 'success' : 'destructive'}
                                                    >
                                                        {t(transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1))}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>${formatDecimalValue(transaction.amount, decimalPrecision)}</TableCell>
                                                <TableCell>{transaction.description}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center">
                                                <div className="flex items-center justify-center h-20">
                                                    <p className="text-gray-500">{t('No transactions found')}</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}