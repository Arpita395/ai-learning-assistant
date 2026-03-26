import React, {useState, useEffect} from 'react';
import { useParams, Link } from 'react-router-dom';
import documentService from '../../services/documentService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

import {ArrowLeft, ExternalLink} from 'lucide-react'

const DocumentDetailPage = () => {

    const {id}= useParams
    const [document, setDocument]= useState(null)
    const [loading, setLoading]= useState(true)
    const [activeTab, setActiveTab]= useState('Content')

    useEffect(()=> {
        const fetchDocumentDetails= async()=> {
            try {
                
            } catch (error) {
                toast.error('Failed to fetch document details')
                console.error(error)
            }
        }
    }, [])
    return ( 
        <div>Document Detail Page</div>
     );
}
 
export default DocumentDetailPage;