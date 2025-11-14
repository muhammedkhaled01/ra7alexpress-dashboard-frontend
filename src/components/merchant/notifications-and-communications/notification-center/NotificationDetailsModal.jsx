import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';
import { Badge } from '@/components/ui/badge';

const NotificationDetailsModal = ({ open, onClose, notification, t }) => {
    if (!notification) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{notification.title}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-1">{t('Type')}:</h3>
                            <Badge variant="outline">{notification.type}</Badge>
                        </div>
                        <div>
                            <h3 className="font-medium mb-1">{t('Message')}:</h3>
                            <p className="text-gray-600">{notification.message}</p>
                        </div>
                        <div>
                            <h3 className="font-medium mb-1">{t('Time')}:</h3>
                            <p className="text-gray-600">
                                {new Date(notification.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>{t('Close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

NotificationDetailsModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    notification: PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        type: PropTypes.string,
        status: PropTypes.string,
        createdAt: PropTypes.string,
        message: PropTypes.string
    }),
    t: PropTypes.func.isRequired
};

export default NotificationDetailsModal;
