// Copyright 2020-2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { ReactPortal, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { About } from './About';
import { Avatar } from '../Avatar';
import { AvatarLightbox } from '../AvatarLightbox';
import { ConversationType } from '../../state/ducks/conversations';
import { LocalizerType } from '../../types/Util';
import { SharedGroupNames } from '../SharedGroupNames';

export type PropsType = {
  areWeAdmin: boolean;
  contact?: ConversationType;
  readonly i18n: LocalizerType;
  isAdmin: boolean;
  isMember: boolean;
  onClose: () => void;
  openConversation: (conversationId: string) => void;
  removeMember: (conversationId: string) => void;
  showSafetyNumber: (conversationId: string) => void;
  toggleAdmin: (conversationId: string) => void;
  updateSharedGroups: () => void;
};

export const ContactModal = ({
  areWeAdmin,
  contact,
  i18n,
  isAdmin,
  isMember,
  onClose,
  openConversation,
  removeMember,
  showSafetyNumber,
  toggleAdmin,
  updateSharedGroups,
}: PropsType): ReactPortal | null => {
  if (!contact) {
    throw new Error('Contact modal opened without a matching contact');
  }

  const [root, setRoot] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLElement | null>(null);

  const [showingAvatar, setShowingAvatar] = useState(false);

  useEffect(() => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    setRoot(div);

    return () => {
      document.body.removeChild(div);
      setRoot(null);
    };
  }, []);

  useEffect(() => {
    // Kick off the expensive hydration of the current sharedGroupNames
    updateSharedGroups();
  }, [updateSharedGroups]);

  useEffect(() => {
    if (root !== null && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [root]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();

        onClose();
      }
    };
    document.addEventListener('keyup', handler);

    return () => {
      document.removeEventListener('keyup', handler);
    };
  }, [onClose]);

  const onClickOverlay = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target === overlayRef.current) {
      e.preventDefault();
      e.stopPropagation();

      onClose();
    }
  };

  let content: JSX.Element;
  if (showingAvatar) {
    content = (
      <AvatarLightbox
        avatarColor={contact.color}
        avatarPath={contact.avatarPath}
        conversationTitle={contact.title}
        i18n={i18n}
        onClose={() => setShowingAvatar(false)}
      />
    );
  } else {
    content = (
      <div className="module-contact-modal">
        <button
          ref={r => {
            closeButtonRef.current = r;
          }}
          type="button"
          className="module-contact-modal__close-button"
          onClick={onClose}
          aria-label={i18n('close')}
        />
        <Avatar
          acceptedMessageRequest={contact.acceptedMessageRequest}
          avatarPath={contact.avatarPath}
          color={contact.color}
          conversationType="direct"
          i18n={i18n}
          isMe={contact.isMe}
          name={contact.name}
          profileName={contact.profileName}
          sharedGroupNames={contact.sharedGroupNames}
          size={96}
          title={contact.title}
          unblurredAvatarPath={contact.unblurredAvatarPath}
          onClick={() => setShowingAvatar(true)}
        />
        <div className="module-contact-modal__name">{contact.title}</div>
        <div className="module-about__container">
          <About text={contact.about} />
        </div>
        {contact.phoneNumber && (
          <div className="module-contact-modal__info">
            {contact.phoneNumber}
          </div>
        )}
        <div className="module-contact-modal__info">
          <SharedGroupNames
            i18n={i18n}
            sharedGroupNames={contact.sharedGroupNames || []}
          />
        </div>
        <div className="module-contact-modal__button-container">
          <button
            type="button"
            className="module-contact-modal__button module-contact-modal__send-message"
            onClick={() => openConversation(contact.id)}
          >
            <div className="module-contact-modal__bubble-icon">
              <div className="module-contact-modal__send-message__bubble-icon" />
            </div>
            <span>{i18n('ContactModal--message')}</span>
          </button>
          {!contact.isMe && (
            <button
              type="button"
              className="module-contact-modal__button module-contact-modal__safety-number"
              onClick={() => showSafetyNumber(contact.id)}
            >
              <div className="module-contact-modal__bubble-icon">
                <div className="module-contact-modal__safety-number__bubble-icon" />
              </div>
              <span>{i18n('showSafetyNumber')}</span>
            </button>
          )}
          {!contact.isMe && areWeAdmin && isMember && (
            <>
              <button
                type="button"
                className="module-contact-modal__button module-contact-modal__make-admin"
                onClick={() => toggleAdmin(contact.id)}
              >
                <div className="module-contact-modal__bubble-icon">
                  <div className="module-contact-modal__make-admin__bubble-icon" />
                </div>
                {isAdmin ? (
                  <span>{i18n('ContactModal--rm-admin')}</span>
                ) : (
                  <span>{i18n('ContactModal--make-admin')}</span>
                )}
              </button>
              <button
                type="button"
                className="module-contact-modal__button module-contact-modal__remove-from-group"
                onClick={() => removeMember(contact.id)}
              >
                <div className="module-contact-modal__bubble-icon">
                  <div className="module-contact-modal__remove-from-group__bubble-icon" />
                </div>
                <span>{i18n('ContactModal--remove-from-group')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return root
    ? createPortal(
        <div
          ref={ref => {
            overlayRef.current = ref;
          }}
          role="presentation"
          className="module-contact-modal__overlay"
          onClick={onClickOverlay}
        >
          {content}
        </div>,
        root
      )
    : null;
};
