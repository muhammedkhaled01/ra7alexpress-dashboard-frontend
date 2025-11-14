import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, NetworkIcon } from 'lucide-react';

// Action Icons Mapping
const ACTION_ICONS = {
    'Login': Activity,
    'Logout': Activity,
    'Profile Update': Activity,
    'Shipment Creation': Activity,
    'Shipment Modification': Activity,
    'Password Change': Activity,
    'Failed Login Attempt': AlertTriangle
};

const UserTimelineView = ({
    isOpen,
    onClose,
    user,
    filteredActions
}) => {
    const { t } = useTranslation();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="p-0 max-w-4xl">
                <Card className="shadow-lg border border-gray-300 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            {t('User Timeline')}: {user?.userName}
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-primary/20">
                            <div className="mb-6 pb-4 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-primary">
                                            {user?.userName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            User ID: {user?.userId}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        {filteredActions.filter(a => a.userId === user?.userId).length} Actions
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4">
                                {filteredActions
                                    .filter(action => action.userId === user?.userId)
                                    .map((action, index) => {
                                        const ActionIcon = ACTION_ICONS[action.actionType] || Activity;
                                        return (
                                            <motion.div
                                                key={action.id}
                                                className="relative pl-10 group"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                {/* Timeline dot */}
                                                <div
                                                    className={`
                                                        absolute left-0 top-1 w-6 h-6 rounded-full border-4 
                                                        ${action.isSuspicious
                                                            ? 'border-red-500 bg-red-100 dark:bg-red-900/30'
                                                            : 'border-primary bg-primary/10'
                                                        }
                                                        flex items-center justify-center
                                                        transition-all group-hover:scale-110
                                                    `}
                                                >
                                                    <ActionIcon
                                                        className={`w-3 h-3 
                                                            ${action.isSuspicious
                                                                ? 'text-red-500'
                                                                : 'text-primary'
                                                            }
                                                        `}
                                                    />
                                                </div>

                                                {/* Action Card */}
                                                <div
                                                    className={`
                                                        p-4 rounded-lg shadow-sm 
                                                        ${action.isSuspicious
                                                            ? 'bg-red-50/20 dark:bg-red-900/20 border-l-4 border-red-500'
                                                            : 'bg-white dark:bg-gray-800/50 border-l-4 border-primary/30'
                                                        }
                                                        transform transition-all 
                                                        group-hover:shadow-md
                                                    `}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-primary">
                                                                {action.actionType}
                                                            </span>
                                                            {action.isSuspicious && (
                                                                <Tooltip content="Suspicious Action">
                                                                    <AlertTriangle
                                                                        className="text-red-500 w-4 h-4"
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDate(action.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {action.details}
                                                    </p>
                                                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                                                        <NetworkIcon className="w-3 h-3" />
                                                        {action.ipAddress} | {action.deviceInfo}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end">
                        <Button onClick={handleClose}>
                            {t('Close')}
                        </Button>
                    </CardFooter>
                </Card>
            </DialogContent>
        </Dialog>
    );
};

UserTimelineView.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    user: PropTypes.shape({
        userName: PropTypes.string,
        userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }),
    filteredActions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        actionType: PropTypes.string,
        timestamp: PropTypes.string,
        details: PropTypes.string,
        ipAddress: PropTypes.string,
        deviceInfo: PropTypes.string,
        isSuspicious: PropTypes.bool
    }))
};

export default UserTimelineView;
