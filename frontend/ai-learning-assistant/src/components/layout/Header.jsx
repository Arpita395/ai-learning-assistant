import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {Bell, User, Menu} from 'lucide-react'

const Header = ({toggleSidebar}) => {
    const {user}= useAuth()

    return <header className=''>
        <div className=''>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleSidebar}
                className=''
                aria-label='Toggle sidebar'
            >
                <Menu size= {24} />
            </button>

            <div className=''></div>

            <div className=''>

            <button className=''>
                <Bell size= {20} strokeWidth={2} className='' />

                <span className=''></span>
            </button>

            {/* User Profile */}
            <div className=''>
                <div className=''>
                    <div className=''>
                        <User size= {18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className=''>
                            {user?.username || 'User'}
                        </p>
                        <p className=''>
                            {user?.email || 'user@example.com'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </header>
}
 
export default Header;
