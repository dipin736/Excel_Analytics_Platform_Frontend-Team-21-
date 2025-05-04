import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiHome, FiBriefcase, FiSave, FiEdit, FiUpload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { BaseUrl, BaseUrluser } from '../../endpoint/baseurl';

const UserProfile = ({darkMode,setDarkMode}) => {

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    age: '',
    gender: '',
    company: '',
    jobTitle: '',
    preferences: {
      theme: 'system',
      dashboardLayout: 'grid',
      emailNotifications: true
    },
    profileImage: ''
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${BaseUrl}/me/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setUserData(data.data);
          setPreviewImage(data.data.profileImage || '');
        }
      } catch (error) {
        toast.error('Failed to fetch user profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('preferences.')) {
      const prefField = name.split('.')[1];
      setUserData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: prefField === 'emailNotifications' ? e.target.checked : value
        }
      }));
    } else {
      setUserData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', userData.name);
      formData.append('phone', userData.phone);
      formData.append('address', userData.address);
      formData.append('age', userData.age);
      formData.append('gender', userData.gender);
      formData.append('company', userData.company);
      formData.append('jobTitle', userData.jobTitle);
      formData.append('preferences[theme]', userData.preferences.theme);
      formData.append('preferences[dashboardLayout]', userData.preferences.dashboardLayout);
      formData.append('preferences[emailNotifications]', userData.preferences.emailNotifications);
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const response = await fetch(`${BaseUrluser}/users/profile/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      console.log('Submitting userData:', userData);

      const data = await response.json();
      if (data.success) {
        toast.success('Profile updated successfully');
        setUserData(data.data);
        if (data.data.profileImage) {
          setPreviewImage(data.data.profileImage);
        }
        setIsEditing(false);
        // Update dark mode if theme preference changed
        if (data.data.preferences.theme === 'dark') {
          setDarkMode(true);
          document.documentElement.classList.add('dark');
        } else if (data.data.preferences.theme === 'light') {
          setDarkMode(false);
          document.documentElement.classList.remove('dark');
        }
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isEditing) {
    return (
      <div className={`flex items-center justify-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }



  return (
    <motion.div
      className={`min-h-screen p-4 md:p-4 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`max-w-4xl mx-auto rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Profile Header */}
        <div className={`p-6 ${darkMode ? 'bg-gray-700' : 'bg-indigo-50'} flex flex-col md:flex-row items-center gap-6`}>
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <FiUser className="text-3xl text-gray-500" />
                </div>
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                <FiUpload />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{userData.name}</h1>
            <p className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <FiMail className="inline" /> {userData.email}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-100'} shadow-md transition-colors`}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'} <FiEdit />
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Personal Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    required
                  />
                ) : (
                  <p className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>{userData.name}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={userData.phone}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                ) : (
                  <p className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>{userData.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={userData.address}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                ) : (
                  <p className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>{userData.address || 'Not provided'}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Age</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="age"
                      value={userData.age}
                      onChange={handleChange}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      min="0"
                    />
                  ) : (
                    <p className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>{userData.age || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gender</label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={userData.gender}
                      onChange={handleChange}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>{userData.gender || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Professional Information</h2>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Company</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="company"
                    value={userData.company}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                ) : (
                  <p className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>{userData.company || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Job Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="jobTitle"
                    value={userData.jobTitle}
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                ) : (
                  <p className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>{userData.jobTitle || 'Not provided'}</p>
                )}
              </div>

            

            </div>
          </div>

          {/* Storage Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Storage Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {Math.round(userData.storageUsed / 1024 / 1024)} MB used
                </span>
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {Math.round(userData.storageLimit / 1024 / 1024)} MB total
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${(userData.storageUsed / userData.storageLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {isEditing && (
            <div className="flex justify-end">
              <motion.button
                type="submit"
                className={`px-6 py-2 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-md`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'} <FiSave />
              </motion.button>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
};

export default UserProfile;