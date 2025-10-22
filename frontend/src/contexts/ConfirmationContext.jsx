import React, { createContext, useContext, useState } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const ConfirmationContext = createContext();

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({});

  const confirm = ({
    title = 'নিশ্চিতকরণ',
    message = 'আপনি কি এই কাজটি করতে চান?',
    confirmText = 'নিশ্চিত করুন',
    cancelText = 'বাতিল',
    type = 'default'
  } = {}) => {
    return new Promise((resolve) => {
      setConfig({
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          resolve(true);
          setIsOpen(false);
        },
        onCancel: () => {
          resolve(false);
          setIsOpen(false);
        }
      });
      setIsOpen(true);
    });
  };

  // Predefined confirmation types for common actions
  const confirmDelete = (itemName = 'আইটেমটি') => {
    return confirm({
      title: 'মুছে ফেলার নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিত যে ${itemName} মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।`,
      confirmText: 'মুছে ফেলুন',
      cancelText: 'বাতিল',
      type: 'danger'
    });
  };

  const confirmUpdate = (itemName = 'তথ্য') => {
    return confirm({
      title: 'আপডেটের নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিত যে ${itemName} আপডেট করতে চান?`,
      confirmText: 'আপডেট করুন',
      cancelText: 'বাতিল',
      type: 'default'
    });
  };

  const confirmLogout = () => {
    return confirm({
      title: 'লগআউটের নিশ্চিতকরণ',
      message: 'আপনি কি নিশ্চিত যে লগআউট করতে চান?',
      confirmText: 'লগআউট',
      cancelText: 'বাতিল',
      type: 'warning'
    });
  };

  const confirmSubmit = (actionName = 'জমা দিতে') => {
    return confirm({
      title: 'জমা দেওয়ার নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিত যে ${actionName} চান?`,
      confirmText: 'জমা দিন',
      cancelText: 'বাতিল',
      type: 'default'
    });
  };

  const confirmBookIssue = (bookTitle, userName) => {
    return confirm({
      title: 'বই ইস্যুর নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিত যে "${bookTitle}" বইটি "${userName}" এর কাছে ইস্যু করতে চান?`,
      confirmText: 'ইস্যু করুন',
      cancelText: 'বাতিল',
      type: 'default'
    });
  };

  const confirmBookReturn = (bookTitle) => {
    return confirm({
      title: 'বই ফেরতের নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিত যে "${bookTitle}" বইটি ফেরত নিতে চান?`,
      confirmText: 'ফেরত নিন',
      cancelText: 'বাতিল',
      type: 'default'
    });
  };

  const confirmDonation = (bookTitle) => {
    return confirm({
      title: 'বই দানের নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিত যে "${bookTitle}" বইটি দান করতে চান?`,
      confirmText: 'দান করুন',
      cancelText: 'বাতিল',
      type: 'default'
    });
  };

  const confirmStatusChange = (newStatus, itemName = 'আইটেম') => {
    return confirm({
      title: 'স্ট্যাটাস পরিবর্তনের নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিত যে ${itemName} এর স্ট্যাটাস "${newStatus}" এ পরিবর্তন করতে চান?`,
      confirmText: 'পরিবর্তন করুন',
      cancelText: 'বাতিল',
      type: 'warning'
    });
  };

  const confirmImageUpload = (imageType = 'ছবি') => {
    return confirm({
      title: 'ছবি আপলোডের নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিত যে এই ${imageType} আপলোড করতে চান?`,
      confirmText: 'আপলোড করুন',
      cancelText: 'বাতিল',
      type: 'default'
    });
  };

  const confirmBulkAction = (actionName, count) => {
    return confirm({
      title: 'বাল্ক অ্যাকশনের নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিত যে ${count}টি আইটেমের উপর "${actionName}" অ্যাকশন চালাতে চান?`,
      confirmText: 'চালিয়ে যান',
      cancelText: 'বাতিল',
      type: 'warning'
    });
  };

  const handleClose = () => {
    config.onCancel?.();
  };

  return (
    <ConfirmationContext.Provider
      value={{
        confirm,
        confirmDelete,
        confirmUpdate,
        confirmLogout,
        confirmSubmit,
        confirmBookIssue,
        confirmBookReturn,
        confirmDonation,
        confirmStatusChange,
        confirmImageUpload,
        confirmBulkAction
      }}
    >
      {children}
      <ConfirmationModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={config.onConfirm}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        type={config.type}
      />
    </ConfirmationContext.Provider>
  );
};