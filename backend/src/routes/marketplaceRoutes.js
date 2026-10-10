import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import {
  handleGetSellingLots,
  handleGetSellingLotById,
  handleCreateSellingLot,
  handleGetMySellingLots,
  handleUpdateMySellingLotStatus,
  handleGetBuyerOpportunities,
  handleGetBuyerProfile,
  handleUpsertBuyerProfile,
  handleGetBuyingRequirements,
  handleCreateBuyingRequirement,
  handleUpdateBuyingRequirementStatus,
  handleGetMatchesForRequirement,
  handleCreateOffer,
  handleGetBuyerOffers,
  handleGetOfferById,
  handleCounterOffer,
  handleAcceptOffer,
  handleRejectOffer,
  handleWithdrawOffer,
  handleGetMarketplaceStats,
  handleCreateFarmerMatchRequest,
  handleGetFarmerMatchRequests,
} from '../controllers/marketplaceController.js';

const router = Router();

// Public / General Marketplace
router.get('/stats', optionalAuth, handleGetMarketplaceStats);
router.get('/lots', optionalAuth, handleGetSellingLots);
router.get('/lots/:id', optionalAuth, handleGetSellingLotById);

// Farmer Marketplace: Buyer Discovery, Direct Match Requests & My Selling Lots
router.get('/opportunities', optionalAuth, handleGetBuyerOpportunities);
router.get('/my-lots', optionalAuth, handleGetMySellingLots);
router.patch('/my-lots/:id/status', requireAuth, handleUpdateMySellingLotStatus);
router.post('/match-request', optionalAuth, handleCreateFarmerMatchRequest);
router.get('/my-match-requests', optionalAuth, handleGetFarmerMatchRequests);

// Farmer Publishing
router.post('/lots', requireAuth, handleCreateSellingLot);

// Buyer Profile
router.get('/buyer/profile', requireAuth, handleGetBuyerProfile);
router.post('/buyer/profile', requireAuth, handleUpsertBuyerProfile);

// Buying Requirements
router.get('/requirements', requireAuth, handleGetBuyingRequirements);
router.post('/requirements', requireAuth, handleCreateBuyingRequirement);
router.patch('/requirements/:id/status', requireAuth, handleUpdateBuyingRequirementStatus);
router.get('/requirements/:id/matches', requireAuth, handleGetMatchesForRequirement);

// Offers & Negotiation
router.post('/offers', requireAuth, handleCreateOffer);
router.get('/offers', requireAuth, handleGetBuyerOffers);
router.get('/offers/:id', requireAuth, handleGetOfferById);
router.post('/offers/:id/counter', requireAuth, handleCounterOffer);
router.post('/offers/:id/accept', requireAuth, handleAcceptOffer);
router.post('/offers/:id/reject', requireAuth, handleRejectOffer);
router.post('/offers/:id/withdraw', requireAuth, handleWithdrawOffer);

export default router;
