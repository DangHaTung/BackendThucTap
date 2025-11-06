import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true,
        enum: [
            'card_created',
            'card_moved',
            'card_updated',
            'card_archived',
            'card_restored',
            'card_completed',
            'card_assigned',
            'card_due_date_set',
            'card_label_added',
            'card_description_updated',
            'comment_added',
            'comment_updated',
            'comment_deleted',
            'checklist_created',
            'checklist_item_added',
            'checklist_item_completed',
            'checklist_item_deleted'
        ]
    },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    
    // Activity data
    data: {
        // For card_created
        listName: { type: String },
        cardTitle: { type: String },
        
        // For card_moved
        fromList: { type: String },
        toList: { type: String },
        
        // For card_updated
        field: { type: String }, // 'title', 'description', 'dueDate', etc.
        oldValue: { type: String },
        newValue: { type: String },
        
        // For card_assigned
        assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assigneeName: { type: String },
        
        // For card_label_added
        label: { type: String },
        
        // For comment activities
        commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
        commentText: { type: String },
        
        // For checklist activities
        checklistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checklist' },
        checklistTitle: { type: String },
        itemText: { type: String },
        
        // Generic data
        value: { type: String },
        details: { type: String },
        description: { type: String }
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false,
});

// Index for better performance
activitySchema.index({ cardId: 1, createdAt: -1 });
activitySchema.index({ boardId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;

