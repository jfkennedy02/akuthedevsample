import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { db } from '../../services/db';
import { Trash2, Edit2, Plus } from 'lucide-react';

const AdminPackages = () => {
    const [packages, setPackages] = useState([]);
    const [editing, setEditing] = useState(null); // null or package object
    const [loading, setLoading] = useState(false);

    const loadPackages = () => db.getPackages().then(setPackages);

    useEffect(() => {
        loadPackages();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Delete this package?")) return;
        await db.deletePackage(id);
        loadPackages();
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        await db.savePackage(editing);
        setEditing(null);
        setLoading(false);
        loadPackages();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-warning">Manage Packages</h1>
                <Button onClick={() => setEditing({ name: '', price: '', roi: '', duration: '', color: 'bronze' })}>
                    <Plus size={18} className="mr-1" /> New Package
                </Button>
            </div>

            {editing && (
                <Card className="mb-6 border-primary">
                    <h3 className="font-bold mb-4">{editing.id ? 'Edit Package' : 'Create New Package'}</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                        <Input
                            label="Name"
                            value={editing.name}
                            onChange={e => setEditing({ ...editing, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Price ($)"
                            type="number"
                            value={editing.price}
                            onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) })}
                            required
                        />
                        <Input
                            label="ROI (%)"
                            type="number"
                            value={editing.roi}
                            onChange={e => setEditing({ ...editing, roi: parseFloat(e.target.value) })}
                            required
                        />
                        <Input
                            label="Duration (Days)"
                            type="number"
                            value={editing.duration}
                            onChange={e => setEditing({ ...editing, duration: parseInt(e.target.value) })}
                            required
                        />
                        <div className="col-span-2 flex gap-2 justify-end mt-2">
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button type="submit" isLoading={loading}>Save Package</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid gap-4">
                {packages.map(pkg => (
                    <Card key={pkg.id} className="flex justify-between items-center p-4">
                        <div>
                            <h3 className="font-bold text-lg">{pkg.name}</h3>
                            <div className="text-sm text-muted">
                                ${pkg.price} • {pkg.roi}% ROI • {pkg.duration} Days
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button className="btn-sm btn-outline" onClick={() => setEditing(pkg)}>
                                <Edit2 size={16} />
                            </Button>
                            <Button className="btn-sm btn-danger" onClick={() => handleDelete(pkg.id)}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default AdminPackages;
