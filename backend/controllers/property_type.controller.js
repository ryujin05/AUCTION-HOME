import mongoose, { mongo } from "mongoose";
import PropertyType from "../models/property_type.model.js";

export const createPropertyType = async (req, res) => {
    try {
        const {
            name,
            description
        } = req.body;

        if(!name) {
            return res.status(400).json({
                message: "Name is required for property type."
            });
        }

        const existingType = await PropertyType.findOne({ name: name });
        if(existingType) {
            return res.status(409).json({
                message: "Property type name already exits"
            });
        }

        const newType = new PropertyType({
            name, 
            description
        });

        await newType.save();

        res.status(201).json({
            message: "Property Type created successfully",
            propertyType: newType
        });

    } catch (error) {
        console.error("Error creating property type: ", error.messgae);
        if(error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Validation failed",
                error: error.message
            });
        }
        res.status(500).json({
            message: "Server error creating property type."
        })
    }
}

export const getAllPropertyTypes = async (req, res) => {
    try {
        const propertyTypes = await PropertyType.find({});

        if(propertyTypes.length === 0) {
            return res.status(404).json({
                message: "No property types found"
            });
        }

        res.status(200).json({
            count: propertyTypes.length,
            propertyTypes
        });
    } catch (error) {
        console.error("Error fetching property types: ", error.messgae);
        res.status(500).json({
            message: "Server error fetching property types."
        });
    }
};

export const getPropertyTypeById = async (req, res) => {
    try {
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid property type ID format."
            });
        }

        const propertyType = await PropertyType.findById(id);

        if(!propertyType) {
            return res.status(404).json({
                message: "Property Type not found"
            });
        }

        res.status(200).json(propertyType);
    } catch (error) {
        console.error("Error fetching property type by ID: ", error.message);
        res.status(500).json({
            message: "Server error fetching property type"
        });
    }
}

export const updatePropertyType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if(!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid property type ID format"
            });
        }

        if(name) {
            const existingType = await PropertyType.findOne({
                name: name,
                _id: { $ne: id }
            });
            if(existingType) {
                return res.status(409).json({
                    message: "Property type name already exists for another document."
                });
            }
        }

        const updatedType = await PropertyType.findByIdAndUpdate(
            id,
            { $set: { name, description }},
            { new: true, runValidators: true }
        );

        if(!updatedType) {
            return res.status(404).json({
                message: "Property Type not found for update"
            });
        }

        res.status(200).json({
            message: "Property Type updated successfully",
            propertyType: updatedType
        });
    } catch (error) {
        console.error("Error updating property type:", error.message);
        if(error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Validation failed during update", 
                error: error.message
            });
        }
        res.status(500).json({
            message: "Server error updating property type"
        });
    }
};

export const deletePropertyType = async (req, res) => {
    try {
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid property type ID format"
            });
        }

        const deletedType = await PropertyType.findByIdAndDelete(id);

        if(!deletedType) {
            return res.status(404).json({
                message: "Property Type not found for deletion"
            });
        }

        res.status(200).json({
            message: "Property Type deleted successfully.",
            propertyType: deletedType
        });
    } catch (error) {
        console.error("Error deleting property type:", error.message);
        res.status(500).json({ message: "Server error deleting property type." });
    }
}