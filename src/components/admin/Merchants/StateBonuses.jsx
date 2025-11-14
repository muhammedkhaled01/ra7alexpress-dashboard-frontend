import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrentCurrency } from '@/utils/helpers';
import { useSelector } from 'react-redux';
import { useLanguage } from '@/contexts/LanguageProvider';

const mockStates = [
    { id: 1, name: 'Muscat', bonus: 0.600 },
    { id: 2, name: 'Seeb', bonus: 0.700 },
    { id: 3, name: 'Salalah', bonus: 0.700 },
    { id: 4, name: 'Sohar', bonus: 0.600 },
    { id: 5, name: 'Nizwa', bonus: 0.600 },
    { id: 6, name: 'Ibra', bonus: 0.700 },
    { id: 7, name: 'Rustaq', bonus: 0.600 },
    { id: 8, name: 'Sur', bonus: 0.700 },
    { id: 9, name: 'Barka', bonus: 0.600 },
    { id: 10, name: 'Dhofar', bonus: 0.700 }
];

export default function StateBonuses() {
    const [states, setStates] = useState(mockStates);
    const [editingState, setEditingState] = useState(null);
    const { currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting)
    const { language } = useLanguage();

    const handleEdit = (state) => {
        setEditingState(state.id);
    };

    const handleSave = (stateId, newBonus) => {
        const updatedStates = states.map((state) =>
            state.id === stateId ? { ...state, bonus: parseFloat(newBonus) } : state
        );
        setStates(updatedStates);
        setEditingState(null);
    };

    const handleCancel = () => {
        setEditingState(null);
    };

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>State Bonuses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">0.600 {formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}</Badge>
                            <Badge variant="destructive">0.700 {formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}</Badge>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>State</TableHead>
                                    <TableHead>Bonus Rate ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)})</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {states.map((state) => (
                                    <TableRow key={state.id}>
                                        <TableCell>{state.name}</TableCell>
                                        <TableCell>
                                            {editingState === state.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.001"
                                                        value={state.bonus}
                                                        onChange={(e) => handleSave(state.id, e.target.value)}
                                                        className="w-24"
                                                    />
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={handleCancel}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Badge variant={state.bonus === 0.700 ? "destructive" : "outline"}>
                                                    {state.bonus}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {editingState !== state.id && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(state)}
                                                >
                                                    Edit
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
